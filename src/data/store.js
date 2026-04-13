import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'printboss_data_v1';

const defaultData = {
  // Settings
  settings: {
    businessName: 'Мой Бизнес',
    currency: '₽',
    electricityRate: 6.5, // руб/кВт·ч
    defaultMargin: 40, // %
    monthlyGoal: 100000,
    weeklyGoal: 25000,
    laborRatePerHour: 0,
  },

  // Orders
  orders: [
    { id: '1', title: 'Корпус камеры', client: 'Иван Петров', status: 'in_progress', priority: 'high', price: 2400, cost: 980, printerId: '1', materialId: '1', materialGrams: 120, printHours: 4.5, createdAt: new Date(Date.now() - 86400000*2).toISOString(), deadline: new Date(Date.now() + 86400000).toISOString(), notes: '', paid: false },
    { id: '2', title: 'Крепёж под динамики', client: 'ООО Аудио', status: 'new', priority: 'normal', price: 1800, cost: 420, printerId: '2', materialId: '2', materialGrams: 85, printHours: 2.5, createdAt: new Date(Date.now() - 86400000).toISOString(), deadline: new Date(Date.now() + 86400000*3).toISOString(), notes: 'Партия 10 штук', paid: true },
    { id: '3', title: 'Держатель телефона', client: 'Сергей К.', status: 'done', priority: 'low', price: 950, cost: 280, printerId: '1', materialId: '1', materialGrams: 45, printHours: 1.5, createdAt: new Date(Date.now() - 86400000*5).toISOString(), deadline: new Date(Date.now() - 86400000).toISOString(), notes: '', paid: true },
    { id: '4', title: 'Запчасть насоса', client: 'Завод №3', status: 'issued', priority: 'high', price: 5600, cost: 1200, printerId: '3', materialId: '3', materialGrams: 280, printHours: 8, createdAt: new Date(Date.now() - 86400000*7).toISOString(), deadline: new Date(Date.now() - 86400000*2).toISOString(), notes: 'PETG, повышенная прочность', paid: true },
  ],

  // Clients
  clients: [
    { id: '1', name: 'Иван Петров', phone: '+7 900 000-00-01', email: 'ivan@mail.ru', notes: 'Постоянный клиент', tags: ['vip'], createdAt: new Date(Date.now() - 86400000*30).toISOString() },
    { id: '2', name: 'ООО Аудио', phone: '+7 495 000-00-02', email: 'audio@corp.ru', notes: 'Корпоративный', tags: ['corp'], createdAt: new Date(Date.now() - 86400000*60).toISOString() },
    { id: '3', name: 'Сергей К.', phone: '+7 900 000-00-03', email: '', notes: '', tags: [], createdAt: new Date(Date.now() - 86400000*10).toISOString() },
    { id: '4', name: 'Завод №3', phone: '+7 812 000-00-04', email: 'factory3@biz.ru', notes: 'Крупные заказы', tags: ['corp', 'large'], createdAt: new Date(Date.now() - 86400000*90).toISOString() },
  ],

  // Printers
  printers: [
    { id: '1', name: 'Ender 3 Pro', model: 'Creality Ender 3 Pro', status: 'working', powerW: 240, hoursTotal: 1240, hoursSinceMaintenance: 45, maintenanceIntervalHours: 200, notes: 'Основной принтер', color: '#22d0e4', purchaseCost: 20000, amortizationPerHour: 2.5 },
    { id: '2', name: 'BambuLab A1', model: 'BambuLab A1', status: 'idle', powerW: 350, hoursTotal: 340, hoursSinceMaintenance: 20, maintenanceIntervalHours: 300, notes: 'Быстрая печать', color: '#a78bfa', purchaseCost: 45000, amortizationPerHour: 5.0 },
    { id: '3', name: 'Resin SLA', model: 'Elegoo Saturn', status: 'maintenance', powerW: 180, hoursTotal: 890, hoursSinceMaintenance: 210, maintenanceIntervalHours: 200, notes: 'Нужна замена FEP пленки', color: '#f59e0b', purchaseCost: 35000, amortizationPerHour: 4.0 },
  ],

  // Materials warehouse
  materials: [
    { id: '1', name: 'PLA Чёрный', type: 'PLA', color: '#1a1a1a', colorHex: '#333', brand: 'Bambu Lab', quantity: 2400, unit: 'г', minQuantity: 500, costPer100g: 95, supplier: 'AliExpress', notes: '' },
    { id: '2', name: 'PLA Белый', type: 'PLA', color: '#f5f5f5', colorHex: '#e8e8e8', brand: 'Esun', quantity: 800, unit: 'г', minQuantity: 500, costPer100g: 90, supplier: 'WH3D', notes: '' },
    { id: '3', name: 'PETG Прозрачный', type: 'PETG', color: '#b0e0ff', colorHex: '#7ec8e3', brand: 'Fillamentum', quantity: 1100, unit: 'г', minQuantity: 300, costPer100g: 130, supplier: 'ОБД', notes: 'Для технических деталей' },
    { id: '4', name: 'PLA Красный', type: 'PLA', color: '#ff4444', colorHex: '#e24b4a', brand: 'Bambu Lab', quantity: 200, unit: 'г', minQuantity: 300, costPer100g: 95, supplier: 'AliExpress', notes: '' },
    { id: '5', name: 'Смола Серая', type: 'Resin', color: '#888', colorHex: '#888780', brand: 'Elegoo', quantity: 500, unit: 'мл', minQuantity: 200, costPer100g: 280, supplier: 'Ozon', notes: 'Для SLA принтера' },
  ],

  // Finished goods warehouse
  products: [
    { id: '1', name: 'Корпус камеры v2', sku: 'CAM-002', quantity: 12, reservedQty: 3, materialId: '1', materialGrams: 120, cost: 980, price: 2400, printerId: '1', printHours: 4.5, category: 'Электроника', notes: 'Популярный товар', createdAt: new Date(Date.now() - 86400000*3).toISOString() },
    { id: '2', name: 'Крепёж динамика', sku: 'AUD-001', quantity: 34, reservedQty: 10, materialId: '2', materialGrams: 85, cost: 420, price: 1800, printerId: '2', printHours: 2.5, category: 'Аудио', notes: '', createdAt: new Date(Date.now() - 86400000*5).toISOString() },
    { id: '3', name: 'Держатель телефона', sku: 'ACC-003', quantity: 8, reservedQty: 0, materialId: '1', materialGrams: 45, cost: 280, price: 950, printerId: '1', printHours: 1.5, category: 'Аксессуары', notes: '', createdAt: new Date(Date.now() - 86400000*1).toISOString() },
  ],

  // Purchases
  purchases: [
    { id: '1', materialId: '1', materialName: 'PLA Чёрный', quantity: 2000, unit: 'г', totalCost: 1900, supplier: 'AliExpress', date: new Date(Date.now() - 86400000*10).toISOString(), notes: '2 катушки по 1кг' },
    { id: '2', materialId: '3', materialName: 'PETG Прозрачный', quantity: 1000, unit: 'г', totalCost: 1300, supplier: 'ОБД', date: new Date(Date.now() - 86400000*5).toISOString(), notes: '' },
  ],

  // Goals
  goals: [
    { id: '1', title: 'Заработать 100 000 ₽ за май', type: 'revenue', target: 100000, current: 89500, deadline: '2025-05-31', done: false, color: '#22d0e4' },
    { id: '2', title: 'Выполнить 50 заказов за месяц', type: 'orders', target: 50, current: 34, deadline: '2025-05-31', done: false, color: '#a78bfa' },
    { id: '3', title: 'Купить новый принтер', type: 'custom', target: 35000, current: 35000, deadline: '2025-06-30', done: true, color: '#22d98a' },
    { id: '4', title: 'Снизить процент брака до 5%', type: 'quality', target: 5, current: 7, deadline: '2025-07-01', done: false, color: '#f59e0b' },
  ],

  // Notes (Stone mode)
  notes: [
    { id: '1', title: 'Идея: автоматическое ценообразование', body: 'Можно сделать формулу: (граммы * цена/г) + (часы * ставка/ч) + электричество + наценка%', createdAt: new Date(Date.now() - 86400000*2).toISOString() },
  ],

  // Transactions (finance log)
  transactions: [
    { id: '1', type: 'income', category: 'order', amount: 5600, description: 'Заказ: Запчасть насоса', date: new Date(Date.now() - 86400000*7).toISOString(), orderId: '4' },
    { id: '2', type: 'expense', category: 'materials', amount: 1900, description: 'Закупка: PLA Чёрный 2кг', date: new Date(Date.now() - 86400000*10).toISOString() },
    { id: '3', type: 'income', category: 'order', amount: 950, description: 'Заказ: Держатель телефона', date: new Date(Date.now() - 86400000*5).toISOString(), orderId: '3' },
    { id: '4', type: 'expense', category: 'materials', amount: 1300, description: 'Закупка: PETG 1кг', date: new Date(Date.now() - 86400000*5).toISOString() },
    { id: '5', type: 'income', category: 'order', amount: 1800, description: 'Заказ: Крепёж под динамики', date: new Date(Date.now() - 86400000*1).toISOString(), orderId: '2' },
    { id: '6', type: 'income', category: 'order', amount: 3840, description: 'Заказ: Корпус камеры (аванс)', date: new Date().toISOString(), orderId: '1' },
  ],

  // Print schedule
  printSchedule: [
    { id: '1', orderId: '1', printerId: '1', startTime: new Date().toISOString(), estimatedHours: 4.5, status: 'printing', notes: '' },
    { id: '2', orderId: '2', printerId: '2', startTime: new Date(Date.now() + 3600000*5).toISOString(), estimatedHours: 2.5, status: 'queued', notes: '' },
  ],
};

function loadData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultData;
    const parsed = JSON.parse(raw);
    // Merge with defaults to add any new fields
    return { ...defaultData, ...parsed };
  } catch {
    return defaultData;
  }
}

function saveData(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.error('Failed to save data', e);
  }
}

export function useStore() {
  const [data, setData] = useState(loadData);

  const update = useCallback((updater) => {
    setData(prev => {
      const next = typeof updater === 'function' ? updater(prev) : { ...prev, ...updater };
      saveData(next);
      return next;
    });
  }, []);

  // Helpers
  const addItem = useCallback((key, item) => {
    update(prev => ({ ...prev, [key]: [...prev[key], item] }));
  }, [update]);

  const updateItem = useCallback((key, id, changes) => {
    update(prev => ({
      ...prev,
      [key]: prev[key].map(item => item.id === id ? { ...item, ...changes } : item)
    }));
  }, [update]);

  const deleteItem = useCallback((key, id) => {
    update(prev => ({ ...prev, [key]: prev[key].filter(item => item.id !== id) }));
  }, [update]);

  // Finance calculations
  const getFinanceStats = useCallback(() => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(todayStart); weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const incomes = data.transactions.filter(t => t.type === 'income');
    const expenses = data.transactions.filter(t => t.type === 'expense');

    const sumInPeriod = (arr, from) => arr.filter(t => new Date(t.date) >= from).reduce((s, t) => s + t.amount, 0);

    const todayIncome = sumInPeriod(incomes, todayStart);
    const weekIncome = sumInPeriod(incomes, weekStart);
    const monthIncome = sumInPeriod(incomes, monthStart);
    const monthExpense = sumInPeriod(expenses, monthStart);
    const monthProfit = monthIncome - monthExpense;
    const margin = monthIncome > 0 ? Math.round((monthProfit / monthIncome) * 100) : 0;

    const activeOrders = data.orders.filter(o => ['new', 'in_progress'].includes(o.status)).length;
    const urgentOrders = data.orders.filter(o => {
      if (!['new', 'in_progress'].includes(o.status)) return false;
      const dl = new Date(o.deadline);
      return (dl - now) < 86400000 * 2;
    }).length;

    return { todayIncome, weekIncome, monthIncome, monthExpense, monthProfit, margin, activeOrders, urgentOrders };
  }, [data.transactions, data.orders]);

  // Smart alerts
  const getAlerts = useCallback(() => {
    const alerts = [];
    const now = new Date();

    // Low materials
    data.materials.forEach(m => {
      if (m.quantity <= m.minQuantity) {
        alerts.push({ type: 'warning', icon: '📦', text: `Мало материала: ${m.name} — осталось ${m.quantity} ${m.unit}`, action: 'materials' });
      }
    });

    // Printer maintenance
    data.printers.forEach(p => {
      if (p.hoursSinceMaintenance >= p.maintenanceIntervalHours) {
        alerts.push({ type: 'danger', icon: '🖨', text: `${p.name}: требуется техобслуживание (${p.hoursSinceMaintenance}ч без ТО)`, action: 'printers' });
      }
    });

    // Overdue orders
    data.orders.filter(o => ['new', 'in_progress'].includes(o.status)).forEach(o => {
      const dl = new Date(o.deadline);
      if (dl < now) {
        alerts.push({ type: 'danger', icon: '⏰', text: `Просрочен заказ: ${o.title} (${o.client})`, action: 'orders' });
      } else if ((dl - now) < 86400000 * 1) {
        alerts.push({ type: 'warning', icon: '⚡', text: `Срочно: "${o.title}" — сдача сегодня`, action: 'orders' });
      }
    });

    // Unpaid orders
    const unpaid = data.orders.filter(o => o.status === 'done' && !o.paid);
    if (unpaid.length > 0) {
      alerts.push({ type: 'info', icon: '💰', text: `${unpaid.length} выполненных заказов ожидают оплаты`, action: 'orders' });
    }

    return alerts;
  }, [data.materials, data.printers, data.orders]);

  return { data, update, addItem, updateItem, deleteItem, getFinanceStats, getAlerts };
}
