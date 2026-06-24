import { describe, expect, it, vi } from 'vitest';
import type { Prisma } from '@prisma/client';
import { decrementerStockPourArticles, restaurerStockPourArticles } from './order-stock';

function createMockTx() {
  const updateMany = vi.fn();
  const update = vi.fn();
  const tx = {
    productVariant: { updateMany, update },
  };
  return { tx: tx as unknown as Prisma.TransactionClient, updateMany, update };
}

describe('decrementerStockPourArticles', () => {
  it('décrémente chaque variante avec stock suffisant', async () => {
    const { tx, updateMany } = createMockTx();
    updateMany.mockResolvedValue({ count: 1 });

    await decrementerStockPourArticles(tx, [
      { variantId: 'v1', quantite: 2 },
      { variantId: 'v2', quantite: 1 },
    ]);

    expect(updateMany).toHaveBeenCalledTimes(2);
    expect(updateMany).toHaveBeenCalledWith({
      where: { id: 'v1', stock: { gte: 2 } },
      data: { stock: { decrement: 2 } },
    });
  });

  it('échoue si stock insuffisant', async () => {
    const { tx, updateMany } = createMockTx();
    updateMany.mockResolvedValueOnce({ count: 1 }).mockResolvedValueOnce({ count: 0 });

    await expect(
      decrementerStockPourArticles(tx, [
        { variantId: 'v1', quantite: 1 },
        { variantId: 'v2', quantite: 5 },
      ]),
    ).rejects.toThrow('Stock insuffisant');
  });
});

describe('restaurerStockPourArticles', () => {
  it('réincrémente le stock de chaque variante', async () => {
    const { tx, update } = createMockTx();
    update.mockResolvedValue({});

    await restaurerStockPourArticles(tx, [{ variantId: 'v1', quantite: 3 }]);

    expect(update).toHaveBeenCalledWith({
      where: { id: 'v1' },
      data: { stock: { increment: 3 } },
    });
  });
});
