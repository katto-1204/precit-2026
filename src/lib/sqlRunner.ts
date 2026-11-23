import initSqlJs, { type SqlJsStatic } from 'sql.js';
import sqlWasmUrl from 'sql.js/dist/sql-wasm.wasm?url';

let sqlModulePromise: Promise<SqlJsStatic> | null = null;

async function getSqlJs(): Promise<SqlJsStatic> {
  if (!sqlModulePromise) {
    sqlModulePromise = initSqlJs({
      locateFile: () => sqlWasmUrl,
      useOldExtensionFunctions: false,
    });
  }
  return sqlModulePromise;
}

export interface SqlTableSchema {
  tableName: string;
  columns: { name: string; type: string; pk: boolean }[];
  rowCount: number;
}

export interface SqlQueryResult {
  ok: boolean;
  columns: string[];
  rows: (string | number | null | Uint8Array)[][];
  error?: string;
  elapsedMs: number;
}

export interface SqlGradeResult {
  passed: boolean;
  earnedPoints: number;
  maxPoints: number;
  userResult: SqlQueryResult;
  expectedColumns: string[];
  expectedRowCount: number;
  feedback: string;
}

export async function inspectSchema(schemaSql: string): Promise<SqlTableSchema[]> {
  const SQL = await getSqlJs();
  const db = new SQL.Database();
  try {
    db.run(schemaSql);
    const tablesRes = db.exec(
      "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name;",
    );
    const tableNames = (tablesRes[0]?.values ?? []).map((row) => String(row[0]));

    return tableNames.map((tableName) => {
      const pragma = db.exec(`PRAGMA table_info("${tableName}");`);
      const columns = (pragma[0]?.values ?? []).map((row) => ({
        name: String(row[1]),
        type: String(row[2] || 'TEXT'),
        pk: Number(row[5]) > 0,
      }));
      const cnt = db.exec(`SELECT COUNT(*) FROM "${tableName}";`);
      const rowCount = Number(cnt[0]?.values?.[0]?.[0] ?? 0);
      return { tableName, columns, rowCount };
    });
  } finally {
    db.close();
  }
}

/**
 * Executes a SQL query against a fresh, isolated in-memory SQLite database seeded with schemaSql.
 */
export async function executeSqlQuery(
  schemaSql: string,
  userSql: string,
): Promise<SqlQueryResult> {
  const started = performance.now();
  const SQL = await getSqlJs();
  const db = new SQL.Database();
  try {
    db.run(schemaSql);
    const res = db.exec(userSql);
    const last = res[res.length - 1];
    return {
      ok: true,
      columns: last?.columns ?? [],
      rows: (last?.values ?? []) as (string | number | null | Uint8Array)[][],
      elapsedMs: Math.round(performance.now() - started),
    };
  } catch (err) {
    return {
      ok: false,
      columns: [],
      rows: [],
      error: err instanceof Error ? err.message : 'SQL execution failed.',
      elapsedMs: Math.round(performance.now() - started),
    };
  } finally {
    db.close();
  }
}

function normalizeRow(row: readonly unknown[]): string {
  return JSON.stringify(
    row.map((val) => (typeof val === 'number' ? Number(val.toFixed(4)) : val)),
  );
}

/**
 * Result-set based SQL grader: allows ANY logically equivalent SQL query producing the exact expected rows.
 */
export async function gradeSqlSubmission(
  schemaSql: string,
  userSql: string,
  expectedSql: string,
  orderSensitive: boolean,
  maxPoints = 50,
): Promise<SqlGradeResult> {
  const [userRes, expectedRes] = await Promise.all([
    executeSqlQuery(schemaSql, userSql),
    executeSqlQuery(schemaSql, expectedSql),
  ]);

  if (!userRes.ok) {
    return {
      passed: false,
      earnedPoints: 0,
      maxPoints,
      userResult: userRes,
      expectedColumns: expectedRes.columns,
      expectedRowCount: expectedRes.rows.length,
      feedback: `SQL Error: ${userRes.error}`,
    };
  }

  const userRows = userRes.rows.map(normalizeRow);
  const expRows = expectedRes.rows.map(normalizeRow);

  const colsMatch =
    userRes.columns.length === expectedRes.columns.length &&
    userRes.columns.every(
      (c, i) => c.toLowerCase() === expectedRes.columns[i].toLowerCase(),
    );

  const rowsMatch = orderSensitive
    ? userRows.length === expRows.length && userRows.every((r, i) => r === expRows[i])
    : userRows.length === expRows.length &&
      [...userRows].sort().every((r, i) => r === [...expRows].sort()[i]);

  if (colsMatch && rowsMatch) {
    return {
      passed: true,
      earnedPoints: maxPoints,
      maxPoints,
      userResult: userRes,
      expectedColumns: expectedRes.columns,
      expectedRowCount: expectedRes.rows.length,
      feedback: `Exact result-set match (${userRes.rows.length} row(s), ${userRes.columns.length} column(s)). Full credit awarded.`,
    };
  }

  if (rowsMatch && !colsMatch) {
    const partial = Math.round(maxPoints * 0.8);
    return {
      passed: false,
      earnedPoints: partial,
      maxPoints,
      userResult: userRes,
      expectedColumns: expectedRes.columns,
      expectedRowCount: expectedRes.rows.length,
      feedback: `Data values match, but column aliases differ. Expected columns: [${expectedRes.columns.join(', ')}]. Partial credit: ${partial}/${maxPoints} pts.`,
    };
  }

  return {
    passed: false,
    earnedPoints: 0,
    maxPoints,
    userResult: userRes,
    expectedColumns: expectedRes.columns,
    expectedRowCount: expectedRes.rows.length,
    feedback: `Result mismatch: returned ${userRes.rows.length} row(s), expected ${expectedRes.rows.length} row(s) with columns [${expectedRes.columns.join(', ')}].`,
  };
}
