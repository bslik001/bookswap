export type SupplyType = 'NOTEBOOK' | 'PEN' | 'BAG' | 'OTHER';

export type Supplier = {
  id: string;
  firstName: string;
  lastName: string;
};

export type Supply = {
  id: string;
  name: string;
  type: SupplyType;
  description: string | null;
  imageUrl: string | null;
  price: string | null;
  supplierId: string;
  createdAt: string;
  supplier: Supplier;
};

export type SupplyFilters = {
  type?: SupplyType;
};
