const API_BASE_URL = import.meta.env.VITE_API_URL || 
  (typeof process !== 'undefined' && process.env?.REACT_APP_API_URL) || 
  'http://localhost:3001/api/pharmacy';

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

class PharmacyApiService {
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Erreur API');
      }

      return data;
    } catch (error: any) {
      console.error(`Erreur API ${endpoint}:`, error);
      throw error;
    }
  }

  // Produits
  async getProducts(params?: {
    category?: string;
    search?: string;
    page?: number;
    limit?: number;
    expired?: boolean;
    nearExpireDays?: number;
  }) {
    const queryParams = new URLSearchParams();
    if (params?.category) queryParams.append('category', params.category);
    if (params?.search) queryParams.append('search', params.search);
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.expired) queryParams.append('expired', 'true');
    if (params?.nearExpireDays) queryParams.append('nearExpireDays', params.nearExpireDays.toString());

    const query = queryParams.toString();
    return this.request<any[]>(`/products${query ? `?${query}` : ''}`);
  }

  async getProductById(id: string) {
    return this.request<any>(`/products/${id}`);
  }

  async createProduct(product: any) {
    return this.request<any>('/products', {
      method: 'POST',
      body: JSON.stringify(product),
    });
  }

  async updateProduct(id: string, product: any) {
    return this.request<any>(`/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(product),
    });
  }

  async deleteProduct(id: string) {
    return this.request<void>(`/products/${id}`, {
      method: 'DELETE',
    });
  }

  // Lots
  async createLot(lot: {
    productId: string;
    lotNumber: string;
    quantity: number;
    unitCost: number;
    datePeremption: string;
    source?: string;
    createdBy?: string;
  }) {
    return this.request<any>('/lots', {
      method: 'POST',
      body: JSON.stringify(lot),
    });
  }

  async getLots(params?: {
    productId?: string;
    expired?: boolean;
    nearExpireDays?: number;
    status?: string;
  }) {
    const queryParams = new URLSearchParams();
    if (params?.productId) queryParams.append('productId', params.productId);
    if (params?.expired) queryParams.append('expired', 'true');
    if (params?.nearExpireDays) queryParams.append('nearExpireDays', params.nearExpireDays.toString());
    if (params?.status) queryParams.append('status', params.status);

    const query = queryParams.toString();
    return this.request<any[]>(`/lots${query ? `?${query}` : ''}`);
  }

  async getLotById(id: string) {
    return this.request<any>(`/lots/${id}`);
  }

  async updateLot(id: string, lot: any) {
    return this.request<any>(`/lots/${id}`, {
      method: 'PUT',
      body: JSON.stringify(lot),
    });
  }

  // Mouvements de stock
  async createStockMovement(movement: {
    productId: string;
    lotId?: string;
    type: 'IN' | 'OUT' | 'ADJUSTMENT' | 'TRANSFER';
    qty: number;
    unitPrice?: number;
    reference?: string;
    reason?: string;
    createdBy?: string;
  }) {
    return this.request<any>('/stock/movement', {
      method: 'POST',
      body: JSON.stringify(movement),
    });
  }

  async getStockMovements(params?: {
    productId?: string;
    lotId?: string;
    type?: string;
    start?: string;
    end?: string;
    page?: number;
    limit?: number;
  }) {
    const queryParams = new URLSearchParams();
    if (params?.productId) queryParams.append('productId', params.productId);
    if (params?.lotId) queryParams.append('lotId', params.lotId);
    if (params?.type) queryParams.append('type', params.type);
    if (params?.start) queryParams.append('start', params.start);
    if (params?.end) queryParams.append('end', params.end);
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());

    const query = queryParams.toString();
    return this.request<any[]>(`/stock/movements${query ? `?${query}` : ''}`);
  }

  // Commandes fournisseurs
  async createOrder(order: {
    supplierId: string;
    items: Array<{
      productId: string;
      qty: number;
      unitPrice: number;
    }>;
    reference?: string;
    createdBy?: string;
  }) {
    return this.request<any>('/orders', {
      method: 'POST',
      body: JSON.stringify(order),
    });
  }

  async getOrders(params?: {
    status?: string;
    supplierId?: string;
  }) {
    const queryParams = new URLSearchParams();
    if (params?.status) queryParams.append('status', params.status);
    if (params?.supplierId) queryParams.append('supplierId', params.supplierId);

    const query = queryParams.toString();
    return this.request<any[]>(`/orders${query ? `?${query}` : ''}`);
  }

  async getOrderById(id: string) {
    return this.request<any>(`/orders/${id}`);
  }

  async updateOrder(id: string, order: any) {
    return this.request<any>(`/orders/${id}`, {
      method: 'PUT',
      body: JSON.stringify(order),
    });
  }

  async receiveOrder(id: string, receivedItems: Array<{
    productId: string;
    lotNumber: string;
    qty: number;
    unitCost: number;
    datePeremption: string;
    source?: string;
  }>, createdBy?: string) {
    return this.request<any>(`/orders/${id}/receive`, {
      method: 'PUT',
      body: JSON.stringify({ receivedItems, createdBy }),
    });
  }

  async cancelOrder(id: string) {
    return this.request<any>(`/orders/${id}`, {
      method: 'DELETE',
    });
  }

  // Fournisseurs
  async getSuppliers() {
    return this.request<any[]>('/suppliers');
  }

  async createSupplier(supplier: {
    name: string;
    contact?: string;
    phone?: string;
    email?: string;
    address?: string;
  }) {
    return this.request<any>('/suppliers', {
      method: 'POST',
      body: JSON.stringify(supplier),
    });
  }

  async updateSupplier(id: string, supplier: any) {
    return this.request<any>(`/suppliers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(supplier),
    });
  }

  async deleteSupplier(id: string) {
    return this.request<void>(`/suppliers/${id}`, {
      method: 'DELETE',
    });
  }

  // Catégories
  async getCategories() {
    return this.request<any[]>('/categories');
  }

  async createCategory(category: {
    name: string;
    description?: string;
  }) {
    return this.request<any>('/categories', {
      method: 'POST',
      body: JSON.stringify(category),
    });
  }

  async updateCategory(id: string, category: any) {
    return this.request<any>(`/categories/${id}`, {
      method: 'PUT',
      body: JSON.stringify(category),
    });
  }

  async deleteCategory(id: string) {
    return this.request<void>(`/categories/${id}`, {
      method: 'DELETE',
    });
  }

  // Dashboard & Alertes
  async getDashboard() {
    return this.request<{
      expired: number;
      nearExpiry: number;
      outOfStock: number;
      nearOutOfStock: number;
    }>('/dashboard');
  }

  async getAlerts() {
    return this.request<{
      expired: any[];
      nearExpiry: any[];
      outOfStock: any[];
      nearOutOfStock: any[];
    }>('/alerts');
  }

  // Paramètres
  async getSettings() {
    return this.request<any>('/settings');
  }

  async updateSettings(settings: {
    alertExpirationDays?: number;
    minStockAlertRatio?: number;
    stockMethod?: 'FIFO' | 'LIFO';
    enableNotifications?: boolean;
    notificationEmail?: string;
    updatedBy?: string;
  }) {
    return this.request<any>('/settings', {
      method: 'PUT',
      body: JSON.stringify(settings),
    });
  }

  // Inventaire
  async getInventory(asOfDate?: string) {
    const query = asOfDate ? `?asOfDate=${asOfDate}` : '';
    return this.request<any[]>(`/stock/inventory${query}`);
  }

  // Prescriptions
  async getPrescriptionQueue(status?: string) {
    const query = status ? `?status=${status}` : '';
    return this.request<any[]>(`/prescriptions/queue${query}`);
  }

  async reservePrescription(id: string, reservedBy: string) {
    return this.request<any>(`/prescriptions/queue/${id}/reserve`, {
      method: 'POST',
      body: JSON.stringify({ reservedBy }),
    });
  }

  async dispensePrescription(id: string, dispensedBy: string) {
    return this.request<any>(`/prescriptions/queue/${id}/dispense`, {
      method: 'POST',
      body: JSON.stringify({ dispensedBy }),
    });
  }

  // Import/Export
  async importProducts(file: File) {
    const formData = new FormData();
    formData.append('file', file);
    
    return fetch(`${API_BASE_URL}/products/import`, {
      method: 'POST',
      body: formData,
    }).then((res) => res.json());
  }

  async exportProducts(format: 'csv' | 'excel' = 'csv') {
    return fetch(`${API_BASE_URL}/products/export?format=${format}`)
      .then((res) => res.blob())
      .then((blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `produits.${format === 'csv' ? 'csv' : 'xlsx'}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      });
  }
}

export default new PharmacyApiService();


