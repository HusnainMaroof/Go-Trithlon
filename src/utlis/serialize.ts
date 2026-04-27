"use server"
// utils/serialize.ts

export function serialize<T>(data: T): T {
  return JSON.parse(
    JSON.stringify(data, (_key, value) =>
      value instanceof Date ? value.toISOString() : value,
    ),
  );
}