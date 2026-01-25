import { integer, real, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const settings = sqliteTable('settings', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    businessName: text('business_name'),
    businessAddress: text('business_address'),
    logoUri: text('logo_uri'),
    signatureUri: text('signature_uri'),
});

export const receipts = sqliteTable('receipts', {
    id: text('id').primaryKey(), // UUID
    receiptNumber: integer('receipt_number').unique(),
    createdAt: integer('created_at').notNull(),
    customerName: text('customer_name'),
    items: text('items').notNull(), // JSON
    totalAmount: real('total_amount').notNull(),
    businessSnapshot: text('business_snapshot'), // JSON
});
