import React, { useState, useCallback, useContext } from 'react';
import { StoreContext } from '../App';
import { v4 as uuid } from 'uuid';

const STATUS_COLS = [
  { id:'new',         label:'Новый',    color:'var(--cyan)'   },
  { id:'in_progress', label:'В работе', color:'var(--amber)'  },
  { id:'done',        label:'Готово',   color:'var(--green)'  },
  { id:'issued',      label:'Выдано',   color:'var(--text2)'  },
];

function fmt(n) { return new Intl.NumberFormat('ru-RU').format(Math.round(n)); }
function fmtD(n) { return n % 1 === 0 ? String(n) : n.toFixed(2); }

// ── Cost calculator ─────────────────────────────────────────────────────
// Returns { material, electricity, amortization, labor, total, breakdown }
function calcCost({ materialId, materialGrams, printerId, printHours, quantity }, store) {
  const mat     = store.data.materials.find(m => m.id === materialId);
  const printer = store.data.printers.find(p => p.id === printerId);
  const { electricityRate, laborRatePerHour = 0 } = store.data.settings;

  const grams  = Number(materialGrams) || 0;
  const hours  = Number(printHours)    || 0;
  const qty    = Number(quantity)      || 1;

  const material     = mat     ? (grams / 100) * mat.costPer100g          : 0;
  const electricity  = printer ? hours * (printer.powerW / 1000) * electricityRate : 0;
  const amortization = printer ? hours * (printer.amortizationPerHour || 0) : 0;
  const labor        = hours * laborRatePerHour;

  const unitCost = material + electricity + amortization + labor;
  const total    = unitCost * qty;

  return {
    material:     Math.round(material),
    electricity:  Math.round(electricity * 100) / 100,
    amortization: Math.round(amortization * 100) / 100,
    labor:        Math.round(labor),
    unitCost:     Math.round(unitCost),
    total:        Math.round(total),
    matName:      mat?.name     || '—',
    printerName:  printer?.name || '—',
    powerW:       printer?.powerW || 0,
    costPer100g:  mat?.costPer100g || 0,
  };
}

// ── Cost breakdown card inside the modal ───────────────────────────────
function CostBreakdown({ calc, margin }) {
  if (!calc.unitCost) return null;
  const suggestedPrice = Math.round(calc.unitCost / (1 - (margin||40)/100));

  return (
    <div style={{
      background:'var(--bg3)', border:'1px solid var(--border)',
      borderRadius:10, padding:'12px 14px', marginBottom:12,
    }}>
      <div style={{fontSize:11,color:'var(--cyan)',fontWeight:600,letterSpacing:'0.07em',textTransform:'uppercase',marginBottom:10}}>
        Калькулятор себестоимости
      </div>

      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:6,marginBottom:10}}>
        {[
          { label:'Материал', value: calc.material+' ₽', sub: calc.matName+', '+calc.costPer100g+'₽/100г', color:'var(--amber)' },
          { label:'Электричество', value: fmtD(calc.electricity)+' ₽', sub: calc.powerW+'Вт × '+fmtD(Number(calc.electricity/Math.max(0.001,(calc.powerW/1000))))+'ч', color:'var(--green)' },
          { label:'Амортизация', value: fmtD(calc.amortization)+' ₽', sub: calc.printerName, color:'var(--purple)' },
          { label:'Труд оператора', value: calc.labor+' ₽', sub: calc.labor===0?'не задан':'руб/ч × часов', color:'var(--text2)' },
        ].map(row => (
          <div key={row.label} style={{background:'var(--bg2)',borderRadius:8,padding:'8px 10px'}}>
            <div style={{fontSize:10,color:'var(--text2)',marginBottom:2}}>{row.label}</div>
            <div style={{fontSize:14,fontWeight:600,fontFamily:'var(--font-display)',color:row.color}}>{row.value}</div>
            <div style={{fontSize:10,color:'var(--text3)',marginTop:1,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{row.sub}</div>
          </div>
        ))}
      </div>

      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'8px 0',borderTop:'1px solid var(--border)'}}>
        <span style={{fontSize:12,color:'var(--text1)'}}>Себестоимость / шт</span>
        <span style={{fontSize:16,fontWeight:700,fontFamily:'var(--font-display)',color:'var(--text0)'}}>{fmt(calc.unitCost)} ₽</span>
      </div>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',paddingTop:4}}>
        <span style={{fontSize:11,color:'var(--text2)'}}>Рекомендуемая цена (+{margin}%)</span>
        <span style={{fontSize:13,fontWeight:600,color:'var(--cyan)'}}>{fmt(suggestedPrice)} ₽</span>
      </div>
    </div>
  );
}

// ── Order card ──────────────────────────────────────────────────────────
function OrderCard({ order, onClick }) {
  const dl      = new Date(order.deadline) - Date.now();
  const dlText  = dl < 0 ? 'просрочен' : dl < 86400000 ? 'сегодня' : Math.floor(dl/86400000)+'д';
  const dlColor = dl < 0 ? 'var(--red)' : dl < 86400000 ? 'var(--amber)' : 'var(--text3)';
  const statusColor = { new:'var(--cyan)', in_progress:'var(--amber)', done:'var(--green)', issued:'var(--text2)' }[order.status];
  const statusLabel = STATUS_COLS.find(c=>c.id===order.status)?.label || order.status;

  return (
    <div className="card card-hover" style={{marginBottom:8,padding:'12px 14px'}} onClick={onClick}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:6}}>
        <div style={{flex:1,minWidth:0}}>
          <div style={{fontSize:13,fontWeight:500,color:'var(--text0)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
            {order.title}
          </div>
          <div style={{fontSize:11,color:'var(--text2)',marginTop:2}}>{order.client}</div>
        </div>
        <div style={{textAlign:'right',flexShrink:0,marginLeft:8}}>
          <div style={{fontSize:13,fontWeight:600,fontFamily:'var(--font-display)',color:'var(--cyan)'}}>
            {fmt(order.price)} ₽
          </div>
          {order.cost > 0 && (
            <div style={{fontSize:10,color:'var(--text3)'}}>
              маржа {Math.round(((order.price-order.cost)/Math.max(1,order.price))*100)}%
            </div>
          )}
        </div>
      </div>
      <div style={{display:'flex',alignItems:'center',gap:6,flexWrap:'wrap'}}>
        <span className="dot" style={{background:statusColor,boxShadow:`0 0 5px ${statusColor}`}}/>
        <span style={{fontSize:11,color:statusColor}}>{statusLabel}</span>
        <span style={{fontSize:10,color:dlColor,marginLeft:4}}>⏱ {dlText}</span>
        {order.priority==='high' && <span className="badge badge-red" style={{fontSize:9,padding:'1px 6px'}}>Срочно</span>}
        {!order.paid && order.status!=='new' && <span style={{fontSize:10,color:'var(--red)',marginLeft:'auto'}}>не оплачен</span>}
        {order.paid && <span style={{fontSize:10,color:'var(--green)',marginLeft:'auto'}}>✓ оплачен</span>}
      </div>
    </div>
  );
}

// ── Order modal (create + edit) ─────────────────────────────────────────
function OrderModal({ order, onClose, store }) {
  const isNew = !order.id;

  const [form, setForm] = useState(() => ({
    title:'', client:'', status:'new', priority:'normal',
    price:'', cost:'',
    printerId:'', materialId:'',
    materialGrams:'', printHours:'', quantity:1,
    notes:'', paid:false,
    deadline: new Date(Date.now()+86400000*3).toISOString().slice(0,10),
    ...order,
  }));

  const set = useCallback((k, v) => setForm(f => ({ ...f, [k]: v })), []);

  // Live cost calculation
  const calc = calcCost(form, store);

  // Auto-fill cost whenever inputs change
  React.useEffect(() => {
    if (calc.unitCost > 0) set('cost', calc.unitCost);
  }, [form.materialId, form.materialGrams, form.printerId, form.printHours, form.quantity]); // eslint-disable-line

  const suggestPrice = () => {
    const cost = Number(form.cost) || calc.unitCost;
    const margin = store.data.settings.defaultMargin;
    if (cost > 0) set('price', Math.round(cost / (1 - margin/100)));
  };

  const save = () => {
    if (!form.title || !form.client) return alert('Укажи название и клиента');
    const item = {
      ...form,
      id:           form.id || uuid(),
      createdAt:    form.createdAt || new Date().toISOString(),
      deadline:     form.deadline ? new Date(form.deadline).toISOString() : new Date(Date.now()+86400000*3).toISOString(),
      price:        Number(form.price) || 0,
      cost:         Number(form.cost)  || 0,
      materialGrams:Number(form.materialGrams) || 0,
      printHours:   Number(form.printHours)    || 0,
      quantity:     Number(form.quantity)      || 1,
    };

    if (isNew) {
      store.addItem('orders', item);
      if (item.paid && item.price > 0) {
        store.addItem('transactions', {
          id:uuid(), type:'income', category:'order',
          amount:item.price,
          description:'Заказ: '+item.title,
          date:new Date().toISOString(),
          orderId:item.id,
        });
      }
    } else {
      store.updateItem('orders', item.id, item);
    }
    onClose();
  };

  const del = () => {
    if (window.confirm('Удалить заказ?')) { store.deleteItem('orders', form.id); onClose(); }
  };

  return (
    <div className="overlay" onClick={e => e.target===e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-handle"/>
        <div className="modal-title">{isNew ? 'Новый заказ' : 'Редактировать заказ'}</div>

        {/* Basic info */}
        <div className="form-group">
          <label>Название *</label>
          <input value={form.title} onChange={e=>set('title',e.target.value)} placeholder="Корпус камеры v2"/>
        </div>

        <div className="form-group">
          <label>Клиент *</label>
          <input value={form.client} onChange={e=>set('client',e.target.value)} placeholder="Иван Петров" list="cl-list"/>
          <datalist id="cl-list">{store.data.clients.map(c=><option key={c.id} value={c.name}/>)}</datalist>
        </div>

        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
          <div className="form-group">
            <label>Статус</label>
            <select value={form.status} onChange={e=>set('status',e.target.value)}>
              {STATUS_COLS.map(c=><option key={c.id} value={c.id}>{c.label}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>Приоритет</label>
            <select value={form.priority} onChange={e=>set('priority',e.target.value)}>
              <option value="low">Низкий</option>
              <option value="normal">Обычный</option>
              <option value="high">Срочный</option>
            </select>
          </div>
        </div>

        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
          <div className="form-group">
            <label>Срок сдачи</label>
            <input type="date" value={form.deadline?.slice(0,10)||''} onChange={e=>set('deadline',e.target.value)}/>
          </div>
          <div className="form-group">
            <label>Количество шт</label>
            <input type="number" min="1" value={form.quantity} onChange={e=>set('quantity',e.target.value)} placeholder="1"/>
          </div>
        </div>

        {/* Production params */}
        <div style={{fontSize:11,color:'var(--cyan)',fontWeight:600,letterSpacing:'0.07em',textTransform:'uppercase',margin:'4px 0 10px'}}>
          Параметры производства
        </div>

        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
          <div className="form-group">
            <label>Принтер</label>
            <select value={form.printerId} onChange={e=>set('printerId',e.target.value)}>
              <option value="">— выбрать —</option>
              {store.data.printers.map(p=>(
                <option key={p.id} value={p.id}>{p.name} ({p.powerW}Вт, {p.amortizationPerHour||0}₽/ч)</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Часов печати</label>
            <input type="number" step="0.25" min="0" value={form.printHours}
              onChange={e=>set('printHours',e.target.value)} placeholder="4.5"/>
          </div>
        </div>

        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
          <div className="form-group">
            <label>Материал</label>
            <select value={form.materialId} onChange={e=>set('materialId',e.target.value)}>
              <option value="">— выбрать —</option>
              {store.data.materials.map(m=>(
                <option key={m.id} value={m.id}>{m.name} ({m.quantity}{m.unit})</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Граммов пластика</label>
            <input type="number" step="1" min="0" value={form.materialGrams}
              onChange={e=>set('materialGrams',e.target.value)} placeholder="120"/>
          </div>
        </div>

        {/* Live cost breakdown */}
        <CostBreakdown calc={calc} margin={store.data.settings.defaultMargin}/>

        {/* Price section */}
        <div style={{fontSize:11,color:'var(--cyan)',fontWeight:600,letterSpacing:'0.07em',textTransform:'uppercase',marginBottom:10}}>
          Цена для клиента
        </div>

        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
          <div className="form-group">
            <label>Себестоимость ₽</label>
            <input type="number" value={form.cost} onChange={e=>set('cost',e.target.value)}
              style={{borderColor: calc.unitCost > 0 ? 'var(--border2)' : ''}}/>
            {calc.unitCost > 0 && Number(form.cost) !== calc.unitCost && (
              <div style={{fontSize:10,color:'var(--amber)',marginTop:3,cursor:'pointer'}}
                onClick={()=>set('cost',calc.unitCost)}>
                ↺ пересчитать: {fmt(calc.unitCost)} ₽
              </div>
            )}
          </div>
          <div className="form-group">
            <div style={{display:'flex',justifyContent:'space-between',marginBottom:4}}>
              <label style={{margin:0}}>Цена продажи ₽</label>
              <button className="btn btn-sm"
                style={{fontSize:10,padding:'1px 7px',borderColor:'var(--cyan)',color:'var(--cyan)'}}
                onClick={suggestPrice}>
                авто +{store.data.settings.defaultMargin}%
              </button>
            </div>
            <input type="number" value={form.price} onChange={e=>set('price',e.target.value)} placeholder="2 400"/>
          </div>
        </div>

        {/* Profit summary */}
        {Number(form.price) > 0 && Number(form.cost) > 0 && (
          <div style={{
            display:'flex', gap:16, padding:'10px 12px', marginBottom:12,
            background:'var(--green-dim)', border:'1px solid rgba(34,217,138,0.2)', borderRadius:10,
          }}>
            <div>
              <div style={{fontSize:10,color:'var(--text2)'}}>Прибыль / шт</div>
              <div style={{fontSize:15,fontWeight:700,fontFamily:'var(--font-display)',color:'var(--green)'}}>
                {fmt(form.price - form.cost)} ₽
              </div>
            </div>
            <div>
              <div style={{fontSize:10,color:'var(--text2)'}}>Маржа</div>
              <div style={{fontSize:15,fontWeight:700,fontFamily:'var(--font-display)',color:'var(--green)'}}>
                {Math.round(((form.price-form.cost)/Math.max(1,Number(form.price)))*100)}%
              </div>
            </div>
            {Number(form.quantity) > 1 && (
              <div>
                <div style={{fontSize:10,color:'var(--text2)'}}>Итого прибыль</div>
                <div style={{fontSize:15,fontWeight:700,fontFamily:'var(--font-display)',color:'var(--green)'}}>
                  {fmt((form.price - form.cost) * Number(form.quantity))} ₽
                </div>
              </div>
            )}
          </div>
        )}

        {/* Notes + paid */}
        <div className="form-group">
          <label>Заметки</label>
          <textarea value={form.notes} onChange={e=>set('notes',e.target.value)}
            placeholder="Доп. требования..." style={{minHeight:60}}/>
        </div>

        <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:14}}>
          <input type="checkbox" id="paid-cb" checked={!!form.paid} onChange={e=>set('paid',e.target.checked)}
            style={{width:16,height:16,accentColor:'var(--green)',flexShrink:0}}/>
          <label htmlFor="paid-cb" style={{margin:0,cursor:'pointer',color:'var(--text1)',fontSize:13}}>
            Оплачен
          </label>
        </div>

        {/* Actions */}
        <div style={{display:'flex',gap:8}}>
          <button className="btn btn-primary" style={{flex:1}} onClick={save}>
            {isNew ? 'Создать заказ' : 'Сохранить'}
          </button>
          {!isNew && <button className="btn btn-danger" onClick={del}>Удалить</button>}
          <button className="btn" onClick={onClose}>Отмена</button>
        </div>
      </div>
    </div>
  );
}

// ── Main Orders page ────────────────────────────────────────────────────
export default function Orders() {
  const store = useContext(StoreContext);
  const [filter, setFilter] = useState('all');
  const [modal,  setModal]  = useState(null);
  const [search, setSearch] = useState('');

  const orders = store.data.orders.filter(o => {
    if (filter !== 'all' && o.status !== filter) return false;
    if (search && !o.title.toLowerCase().includes(search.toLowerCase()) &&
                  !o.client.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div style={{padding:'16px'}}>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:12}}>
        <h2 style={{fontSize:20,fontWeight:700}}>Заказы</h2>
        <button className="btn btn-primary btn-sm" onClick={()=>setModal({})}>+ Новый</button>
      </div>

      <input value={search} onChange={e=>setSearch(e.target.value)}
        placeholder="🔍 Поиск заказа или клиента..." style={{marginBottom:10}}/>

      {/* Filter pills */}
      <div style={{display:'flex',gap:6,marginBottom:12,overflowX:'auto',paddingBottom:4}}>
        {[{id:'all',label:'Все'}, ...STATUS_COLS].map(f => (
          <button key={f.id} onClick={()=>setFilter(f.id)} className="btn btn-sm"
            style={{
              flexShrink:0,
              background:    filter===f.id ? 'var(--cyan-dim)' : '',
              borderColor:   filter===f.id ? 'var(--cyan)' : '',
              color:         filter===f.id ? 'var(--cyan)' : '',
            }}>
            {f.label} ({store.data.orders.filter(o=>f.id==='all'||o.status===f.id).length})
          </button>
        ))}
      </div>

      {orders.length === 0 && (
        <div className="empty">
          <div className="empty-icon">📋</div>
          <div className="empty-text">Нет заказов</div>
          <div className="empty-sub">Нажми «+ Новый» чтобы добавить</div>
        </div>
      )}

      {orders.map(order => (
        <OrderCard key={order.id} order={order} onClick={()=>setModal(order)}/>
      ))}

      {modal !== null && (
        <OrderModal order={modal} onClose={()=>setModal(null)} store={store}/>
      )}
    </div>
  );
}
