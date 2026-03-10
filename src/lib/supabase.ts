import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const isSupabaseConfigured = Boolean(supabaseUrl && supabaseKey);

type TableName = 'students' | 'organizers' | 'events' | 'registrations';

interface InMemoryRow {
  id: string;
  [key: string]: any;
}

interface LocalDB {
  students: InMemoryRow[];
  organizers: InMemoryRow[];
  events: InMemoryRow[];
  registrations: InMemoryRow[];
}

const generateId = () =>
  typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.floor(Math.random() * 1000000)}`;

const defaultDb: LocalDB = {
  students: [
    {
      id: 'student-1',
      name: 'Sample Student',
      roll_no: 'S001',
      dept: 'CSE',
      year: 3,
      email: 'student@vnrvjiet.in',
      password: 'password',
      attendance_percentage: 85,
    },
  ],
  organizers: [
    {
      id: 'organizer-1',
      name: 'Sample Organizer',
      email: 'organizer@vnrvjiet.in',
      password: 'password',
    },
  ],
  events: [
    {
      id: 'event-1',
      title: 'Welcome Fest',
      date: new Date().toISOString().split('T')[0],
      time: '18:00',
      venue: 'Main Auditorium',
      description: 'Kick off the new semester with fun activities and networking.',
      organizer_id: 'organizer-1',
    },
  ],
  registrations: [],
};

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}

function buildPredicate(type: string, column: string, value: any) {
  switch (type) {
    case 'eq':
      return (row: any) => row[column] === value;
    case 'neq':
      return (row: any) => row[column] !== value;
    case 'gte':
      return (row: any) => row[column] >= value;
    case 'in':
      return (row: any) => Array.isArray(value) && value.includes(row[column]);
    case 'is':
      return (row: any) => row[column] === value;
    case 'like':
      return (row: any) =>
        typeof row[column] === 'string' &&
        typeof value === 'string' &&
        row[column].toLowerCase().includes(value.toLowerCase());
    default:
      return () => true;
  }
}

function parseOrCondition(expression: string) {
  // Example: "roll_no.eq.S001,email.eq.S002"
  const parts = expression.split(',');
  const predicates = parts.map((part) => {
    const [col, op, ...rest] = part.split('.');
    const val = rest.join('.');
    const parsedValue = isNaN(Number(val)) ? val : Number(val);
    return buildPredicate(op, col, parsedValue);
  });

  return (row: any) => predicates.some((pred) => pred(row));
}

function createLocalSupabaseClient() {
  const db: LocalDB = clone(defaultDb);

  function getTable(table: TableName) {
    return db[table] as InMemoryRow[];
  }

  function queryBuilder(table: TableName) {
    const predicates: Array<(row: any) => boolean> = [];
    let orderBy: { column: string; ascending: boolean } | null = null;
    let limitCount: number | null = null;
    let head = false;
    let countMode: 'exact' | null = null;
    let shouldJoinEvents = false;

    const chain: any = {
      select(columns?: string, opts?: { count?: 'exact'; head?: boolean }) {
        if (typeof columns === 'string' && columns.includes('events(*)')) {
          shouldJoinEvents = true;
        }
        if (opts?.head) head = true;
        if (opts?.count) countMode = opts.count;
        return chain;
      },
      eq(column: string, value: any) {
        predicates.push(buildPredicate('eq', column, value));
        return chain;
      },
      neq(column: string, value: any) {
        predicates.push(buildPredicate('neq', column, value));
        return chain;
      },
      gte(column: string, value: any) {
        predicates.push(buildPredicate('gte', column, value));
        return chain;
      },
      in(column: string, value: any[]) {
        predicates.push(buildPredicate('in', column, value));
        return chain;
      },
      is(column: string, value: any) {
        predicates.push(buildPredicate('is', column, value));
        return chain;
      },
      like(column: string, value: any) {
        predicates.push(buildPredicate('like', column, value));
        return chain;
      },
      or(expression: string) {
        predicates.push(parseOrCondition(expression));
        return chain;
      },
      order(column: string, opts?: { ascending?: boolean }) {
        orderBy = { column, ascending: opts?.ascending ?? true };
        return chain;
      },
      limit(count: number) {
        limitCount = count;
        return chain;
      },
      range(_from: number, to: number) {
        limitCount = to - _from + 1;
        return chain;
      },
      then(onFulfilled: (value: any) => any, onRejected?: (reason: any) => any) {
        const results = chain._execute();
        let response: any;
        if (head) {
          response = { data: null, count: results.length };
        } else if (countMode === 'exact') {
          response = { data: results, count: results.length };
        } else {
          response = { data: results, error: null };
        }
        return Promise.resolve(response).then(onFulfilled, onRejected);
      },
      async maybeSingle() {
        const results = chain._execute();
        return { data: results[0] ?? null, error: null };
      },
      async single() {
        const results = chain._execute();
        return { data: results[0] ?? null, error: null };
      },
      async insert(rows: any[]) {
        const tableData = getTable(table);
        const inserted = rows.map((row) => {
          const newRow = { ...row, id: row.id ?? generateId() };
          tableData.push(newRow);
          return newRow;
        });
        return { data: inserted, error: null };
      },
      async update(updates: any) {
        const tableData = getTable(table);
        const results = chain._execute();
        const updated = results.map((row: any) => {
          const idx = tableData.findIndex((r) => r.id === row.id);
          if (idx !== -1) {
            tableData[idx] = { ...tableData[idx], ...updates };
          }
          return tableData[idx];
        });
        return { data: updated, error: null };
      },
      async delete() {
        const tableData = getTable(table);
        const results = chain._execute();
        results.forEach((row: any) => {
          const idx = tableData.findIndex((r) => r.id === row.id);
          if (idx !== -1) tableData.splice(idx, 1);
        });
        return { data: results, error: null };
      },
      _execute() {
        let rows = getTable(table);
        rows = rows.filter((row) => predicates.every((pred) => pred(row)));
        if (orderBy) {
          rows = [...rows].sort((a, b) => {
            const aVal = a[orderBy!.column];
            const bVal = b[orderBy!.column];
            if (aVal === bVal) return 0;
            const comp = aVal > bVal ? 1 : -1;
            return orderBy!.ascending ? comp : -comp;
          });
        }
        if (limitCount !== null) {
          rows = rows.slice(0, limitCount);
        }

        const results = rows.map((row) => {
          const cloned = clone(row);
          if (shouldJoinEvents && table === 'registrations') {
            const event = db.events.find((e) => e.id === row.event_id);
            return { ...cloned, events: event ? clone(event) : null };
          }
          if (shouldJoinEvents && table === 'events') {
            // noop
          }
          return cloned;
        });

        return results;
      },
    };

    return chain;
  }

  return {
    from: (table: TableName) => queryBuilder(table),
    rpc: async () => ({ data: null, error: null }),
    auth: {
      signIn: async () => ({ data: null, error: null }),
      signUp: async () => ({ data: null, error: null }),
      signOut: async () => ({ error: null }),
      user: () => null,
    },
  };
}

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseKey)
  : createLocalSupabaseClient();
