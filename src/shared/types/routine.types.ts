export interface RoutineProduct {
  id: number;
  step: string;
  name: string;
  brand: string;
  price: number;
  currency: string;
  imageUrl?: string;
  purchaseUrl?: string;
}

export interface RoutineResponse {
  status: 'processing' | 'ready';
  rspid: string;
  products?: RoutineProduct[];
}
