import React, { useState, useContext } from 'react';
import { StoreContext } from '../App';
import { v4 as uuid } from 'uuid';

function fmt(n) { return new Intl.NumberFormat('ru-RU').format(Math.round(n)); }

// ───── Material Modal ─────
function MatModal({ item, onClose, store }) {
  const isNew = !item.id;
  const [f, setF] = useState(item || { name:'', type:'PLA', colorHex:'#22d0e4', brand:'', quantity:'', unit:'г', minQuantity:'', costPer100g:'', supplier:'', notes:'' });
  const set = (k,v) => setF(p => ({...p,[k]:v}));

  const save = () => {
    if (!f.name) return alert('Укажи название');
    const obj = { ...f, id:f.id||uuid(), quantity:Number(f.quantity)||0, minQuantity:Number(f.minQuantity)||0, costPer100g:Number(f.costPer100g)||0 };
    if (isNew) store.addItem('materials', obj);
    else store.updateItem('materials', obj.id, obj);
    onClose();
  };
  const del = () => { if(window.confirm('Удалить?')) { store.deleteItem('materials',f.id); onClose(); }};

  return (
    <div className="overlay" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="modal">
        <div className="modal-handle"/>
        <div className="modal-title">{isNew?'Новый материал':'Редактировать'}</div>
        <div className="form-group"><label>Название *</label><input value={f.name} onChange={e=>set('name',e.target.value)} placeholder="PLA Чёрный"/></div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
          <div className="form-group"><label>Тип</label>
            <select value={f.type} onChange={e=>set('type',e.target.value)}>
              {['PLA','PETG','ABS','ASA','Resin','TPU','Нейлон','Другое'].map(t=><option key={t}>{t}</option>)}
            </select>
          </div>
          <div className="form-group"><label>Единица</label>
            <select value={f.unit} onChange={e=>set('unit',e.target.value)}>
              {['г','кг','мл','л','шт'].map(u=><option key={u}>{u}</option>)}
            </select>
          </div>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
          <div className="form-group"><label>Количество</label><input type="number" value={f.quantity} onChange={e=>set('quantity',e.target.value)} placeholder="1000"/></div>
          <div className="form-group"><label>Минимум (порог)</label><input type="number" value={f.minQuantity} onChange={e=>set('minQuantity',e.target.value)} placeholder="300"/></div>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
          <div className="form-group"><label>Цена за 100г/мл ₽</label><input type="number" value={f.costPer100g} onChange={e=>set('costPer100g',e.target.value)} placeholder="95"/></div>
          <div className="form-group"><label>Цвет</label><input type="color" value={f.colorHex} onChange={e=>set('colorHex',e.target.value)} style={{height:38, padding:'2px 4px', cursor:'pointer'}}/></div>
        </div>
        <div className="form-group"><label>Бренд</label><input value={f.brand} onChange={e=>set('brand',e.target.value)} placeholder="Bambu Lab"/></div>
        <div className="form-group"><label>Поставщик</label><input value={f.supplier} onChange={e=>set('supplier',e.target.value)} placeholder="AliExpress"/></div>
        <div className="form-group"><label>Заметки</label><textarea value={f.notes} onChange={e=>set('notes',e.target.value)} style={{minHeight:50}}/></div>
        <div style={{display:'flex',gap:8,marginTop:8}}>
          <button className="btn btn-primary" style={{flex:1}} onClick={save}>{isNew?'Добавить':'Сохранить'}</button>
          {!isNew && <button className="btn btn-danger btn-sm" onClick={del}>Удалить</button>}
          <button className="btn" onClick={onClose}>Отмена</button>
        </div>
      </div>
    </div>
  );
}

// ───── Product Modal ─────
function ProdModal({ item, onClose, store }) {
  const isNew = !item.id;
  const [f, setF] = useState(item || { name:'', sku:'', category:'', quantity:'', reservedQty:'', materialId:'', materialGrams:'', cost:'', price:'', printerId:'', printHours:'', notes:'' });
  const set = (k,v) => setF(p => ({...p,[k]:v}));

  // Auto-calc cost
  React.useEffect(() => {
    if (!f.materialId || !f.materialGrams) return;
    const mat = store.data.materials.find(m=>m.id===f.materialId);
    const printer = store.data.printers.find(p=>p.id===f.printerId);
    if (!mat) return;
    const matCost = (Number(f.materialGrams)/100)*mat.costPer100g;
    const elecCost = printer ? (Number(f.printHours)||0)*(printer.powerW/1000)*store.data.settings.electricityRate : 0;
    setF(p=>({...p, cost:Math.round(matCost+elecCost)}));
  }, [f.materialId, f.materialGrams, f.printerId, f.printHours]);

  const save = () => {
    if (!f.name) return alert('Укажи название');
    const obj = { ...f, id:f.id||uuid(), quantity:Number(f.quantity)||0, reservedQty:Number(f.reservedQty)||0, materialGrams:Number(f.materialGrams)||0, cost:Number(f.cost)||0, price:Number(f.price)||0, printHours:Number(f.printHours)||0, createdAt:f.createdAt||new Date().toISOString() };
    if (isNew) store.addItem('products', obj);
    else store.updateItem('products', obj.id, obj);
    onClose();
  };
  const del = () => { if(window.confirm('Удалить?')) { store.deleteItem('products',f.id); onClose(); }};

  return (
    <div className="overlay" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="modal">
        <div className="modal-handle"/>
        <div className="modal-title">{isNew?'Новый товар':'Редактировать товар'}</div>
        <div className="form-group"><label>Название *</label><input value={f.name} onChange={e=>set('name',e.target.value)} placeholder="Корпус камеры v2"/></div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
          <div className="form-group"><label>Артикул (SKU)</label><input value={f.sku} onChange={e=>set('sku',e.target.value)} placeholder="CAM-002"/></div>
          <div className="form-group"><label>Категория</label><input value={f.category} onChange={e=>set('category',e.target.value)} placeholder="Электроника"/></div>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
          <div className="form-group"><label>На складе (шт)</label><input type="number" value={f.quantity} onChange={e=>set('quantity',e.target.value)}/></div>
          <div className="form-group"><label>Зарезервировано</label><input type="number" value={f.reservedQty} onChange={e=>set('reservedQty',e.target.value)}/></div>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
          <div className="form-group"><label>Материал</label>
            <select value={f.materialId} onChange={e=>set('materialId',e.target.value)}>
              <option value="">— выбрать —</option>
              {store.data.materials.map(m=><option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
          </div>
          <div className="form-group"><label>Граммов на шт</label><input type="number" value={f.materialGrams} onChange={e=>set('materialGrams',e.target.value)} placeholder="120"/></div>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
          <div className="form-group"><label>Принтер</label>
            <select value={f.printerId} onChange={e=>set('printerId',e.target.value)}>
              <option value="">— выбрать —</option>
              {store.data.printers.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div className="form-group"><label>Часов печати</label><input type="number" step="0.5" value={f.printHours} onChange={e=>set('printHours',e.target.value)}/></div>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
          <div className="form-group"><label>Себестоимость ₽</label><input type="number" value={f.cost} onChange={e=>set('cost',e.target.value)}/></div>
          <div className="form-group"><label>Цена продажи ₽</label><input type="number" value={f.price} onChange={e=>set('price',e.target.value)}/></div>
        </div>
        <div className="form-group"><label>Заметки</label><textarea value={f.notes} onChange={e=>set('notes',e.target.value)} style={{minHeight:50}}/></div>
        <div style={{display:'flex',gap:8,marginTop:8}}>
          <button className="btn btn-primary" style={{flex:1}} onClick={save}>{isNew?'Добавить':'Сохранить'}</button>
          {!isNew && <button className="btn btn-danger btn-sm" onClick={del}>Удалить</button>}
          <button className="btn" onClick={onClose}>Отмена</button>
        </div>
      </div>
    </div>
  );
}

// ───── Purchase Modal ─────
function PurchaseModal({ onClose, store }) {
  const [f, setF] = useState({ materialId:'', quantity:'', totalCost:'', supplier:'', date:new Date().toISOString().slice(0,10), notes:'' });
  const set = (k,v) => setF(p=>({...p,[k]:v}));
  const save = () => {
    if (!f.materialId || !f.quantity) return alert('Выбери материал и количество');
    const mat = store.data.materials.find(m=>m.id===f.materialId);
    const obj = { id:uuid(), materialId:f.materialId, materialName:mat?.name||'', quantity:Number(f.quantity), unit:mat?.unit||'г', totalCost:Number(f.totalCost)||0, supplier:f.supplier, date:new Date(f.date).toISOString(), notes:f.notes };
    store.addItem('purchases', obj);
    // Update material quantity
    store.updateItem('materials', f.materialId, { quantity: (mat?.quantity||0) + Number(f.quantity) });
    // Add expense transaction
    if (obj.totalCost>0) store.addItem('transactions', { id:uuid(), type:'expense', category:'materials', amount:obj.totalCost, description:'Закупка: '+obj.materialName, date:new Date().toISOString() });
    onClose();
  };
  return (
    <div className="overlay" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="modal">
        <div className="modal-handle"/>
        <div className="modal-title">Закупка материала</div>
        <div className="form-group"><label>Материал *</label>
          <select value={f.materialId} onChange={e=>set('materialId',e.target.value)}>
            <option value="">— выбрать —</option>
            {store.data.materials.map(m=><option key={m.id} value={m.id}>{m.name} (ост. {m.quantity} {m.unit})</option>)}
          </select>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
          <div className="form-group"><label>Количество</label><input type="number" value={f.quantity} onChange={e=>set('quantity',e.target.value)} placeholder="1000"/></div>
          <div className="form-group"><label>Сумма ₽</label><input type="number" value={f.totalCost} onChange={e=>set('totalCost',e.target.value)} placeholder="1900"/></div>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
          <div className="form-group"><label>Поставщик</label><input value={f.supplier} onChange={e=>set('supplier',e.target.value)} placeholder="AliExpress"/></div>
          <div className="form-group"><label>Дата</label><input type="date" value={f.date} onChange={e=>set('date',e.target.value)}/></div>
        </div>
        <div className="form-group"><label>Заметки</label><textarea value={f.notes} onChange={e=>set('notes',e.target.value)} style={{minHeight:50}}/></div>
        <div style={{display:'flex',gap:8,marginTop:8}}>
          <button className="btn btn-primary" style={{flex:1}} onClick={save}>Оприходовать</button>
          <button className="btn" onClick={onClose}>Отмена</button>
        </div>
      </div>
    </div>
  );
}

// ───── Main Warehouse Page ─────
export default function Warehouse({ sub }) {
  const store = useContext(StoreContext);
  const [tab, setTab] = useState(sub==='products' ? 'products' : 'materials');
  const [modal, setModal] = useState(null);
  const [purchaseModal, setPurchaseModal] = useState(false);

  const { materials, products } = store.data;
  const totalMatValue = materials.reduce((s,m) => s+(m.quantity/100*m.costPer100g),0);
  const totalProdValue = products.reduce((s,p) => s+p.quantity*p.cost,0);
  const totalProdRevenue = products.reduce((s,p) => s+p.quantity*p.price,0);

  return (
    <div style={{padding:'16px'}}>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:12}}>
        <h2 style={{fontSize:20,fontWeight:700}}>Склад</h2>
        <div style={{display:'flex',gap:6}}>
          {tab==='materials' && <button className="btn btn-sm" style={{borderColor:'var(--amber)',color:'var(--amber)'}} onClick={()=>setPurchaseModal(true)}>📥 Закупка</button>}
          <button className="btn btn-primary btn-sm" onClick={()=>setModal({})}>+</button>
        </div>
      </div>

      {/* Summary cards */}
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:14}}>
        <div className="stat-card" style={{cursor:'pointer',borderColor:tab==='materials'?'var(--amber)':''}} onClick={()=>setTab('materials')}>
          <div className="stat-label">🧱 Склад материалов</div>
          <div className="stat-value" style={{fontSize:18,color:'var(--amber)'}}>{fmt(totalMatValue)} ₽</div>
          <div className="stat-sub">{materials.length} позиций</div>
        </div>
        <div className="stat-card" style={{cursor:'pointer',borderColor:tab==='products'?'var(--green)':''}} onClick={()=>setTab('products')}>
          <div className="stat-label">📦 Готовая продукция</div>
          <div className="stat-value" style={{fontSize:18,color:'var(--green)'}}>{fmt(totalProdRevenue)} ₽</div>
          <div className="stat-sub">себест. {fmt(totalProdValue)} ₽</div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{display:'flex',gap:8,marginBottom:14}}>
        {[{id:'materials',label:'Материалы'},{id:'products',label:'Готовая продукция'},{id:'purchases',label:'Закупки'}].map(t=>(
          <button key={t.id} className="btn btn-sm" onClick={()=>setTab(t.id)}
            style={{background:tab===t.id?'var(--cyan-dim)':'',borderColor:tab===t.id?'var(--cyan)':'',color:tab===t.id?'var(--cyan)':''}}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Materials */}
      {tab==='materials' && (
        <div>
          {materials.map(m => {
            const pct = Math.min(100, Math.round((m.quantity/Math.max(m.minQuantity*3,m.quantity))*100));
            const low = m.quantity <= m.minQuantity;
            return (
              <div key={m.id} className="card card-hover" style={{marginBottom:8,padding:'12px 14px',borderColor:low?'rgba(245,158,11,0.3)':''}} onClick={()=>setModal(m)}>
                <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:6}}>
                  <div style={{width:12,height:12,borderRadius:'50%',background:m.colorHex,flexShrink:0,border:'1px solid rgba(255,255,255,0.1)'}}/>
                  <span style={{fontSize:13,fontWeight:500,flex:1,color:'var(--text0)'}}>{m.name}</span>
                  <span className={`badge ${low?'badge-amber':'badge-gray'}`}>{m.type}</span>
                  <span style={{fontSize:13,fontWeight:600,fontFamily:'var(--font-display)',color:low?'var(--amber)':'var(--text0)'}}>{m.quantity} {m.unit}</span>
                </div>
                <div className="progress"><div className="progress-fill" style={{width:pct+'%',background:low?'var(--amber)':'var(--cyan)'}}/></div>
                <div style={{display:'flex',justifyContent:'space-between',marginTop:6,fontSize:11,color:'var(--text2)'}}>
                  <span>{m.brand}</span>
                  <span>{fmt(m.quantity/100*m.costPer100g)} ₽ · {m.costPer100g}₽/100{m.unit}</span>
                </div>
                {low && <div style={{fontSize:10,color:'var(--amber)',marginTop:4}}>⚠ Ниже минимума ({m.minQuantity} {m.unit})</div>}
              </div>
            );
          })}
          {materials.length===0 && <div className="empty"><div className="empty-icon">🧱</div><div className="empty-text">Нет материалов</div></div>}
        </div>
      )}

      {/* Products */}
      {tab==='products' && (
        <div>
          {products.map(p => {
            const avail = p.quantity - (p.reservedQty||0);
            const margin = p.price>0 ? Math.round(((p.price-p.cost)/p.price)*100) : 0;
            return (
              <div key={p.id} className="card card-hover" style={{marginBottom:8,padding:'12px 14px'}} onClick={()=>setModal({...p,_type:'product'})}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:6}}>
                  <div>
                    <div style={{fontSize:13,fontWeight:500,color:'var(--text0)'}}>{p.name}</div>
                    <div style={{fontSize:11,color:'var(--text2)',marginTop:2}}>{p.sku} · {p.category}</div>
                  </div>
                  <div style={{textAlign:'right'}}>
                    <div style={{fontSize:18,fontWeight:700,fontFamily:'var(--font-display)',color:'var(--green)'}}>{p.quantity} <span style={{fontSize:12}}>шт</span></div>
                    <div style={{fontSize:10,color:'var(--text3)'}}>своб. {avail}</div>
                  </div>
                </div>
                <div style={{display:'flex',justifyContent:'space-between',fontSize:11,color:'var(--text2)'}}>
                  <span>себест. {fmt(p.cost)} ₽</span>
                  <span style={{color:'var(--cyan)'}}>продажа {fmt(p.price)} ₽</span>
                  <span style={{color:'var(--green)'}}>маржа {margin}%</span>
                </div>
              </div>
            );
          })}
          {products.length===0 && <div className="empty"><div className="empty-icon">📦</div><div className="empty-text">Нет товаров</div></div>}
        </div>
      )}

      {/* Purchases */}
      {tab==='purchases' && (
        <div>
          <button className="btn" style={{borderColor:'var(--amber)',color:'var(--amber)',width:'100%',marginBottom:12,justifyContent:'center'}} onClick={()=>setPurchaseModal(true)}>
            📥 Новая закупка
          </button>
          {store.data.purchases.slice().reverse().map(p=>(
            <div key={p.id} className="card" style={{marginBottom:8,padding:'12px 14px'}}>
              <div style={{display:'flex',justifyContent:'space-between'}}>
                <div>
                  <div style={{fontSize:13,fontWeight:500,color:'var(--text0)'}}>{p.materialName}</div>
                  <div style={{fontSize:11,color:'var(--text2)',marginTop:2}}>{p.supplier} · {new Date(p.date).toLocaleDateString('ru-RU')}</div>
                  {p.notes && <div style={{fontSize:11,color:'var(--text3)',marginTop:2}}>{p.notes}</div>}
                </div>
                <div style={{textAlign:'right'}}>
                  <div style={{fontSize:13,fontWeight:600,color:'var(--amber)'}}>{p.quantity} {p.unit}</div>
                  <div style={{fontSize:12,color:'var(--red)'}}>{fmt(p.totalCost)} ₽</div>
                </div>
              </div>
            </div>
          ))}
          {store.data.purchases.length===0 && <div className="empty"><div className="empty-text">Нет закупок</div></div>}
        </div>
      )}

      {modal !== null && (
        (tab === 'products' || modal._type === 'product')
          ? <ProdModal item={modal} onClose={()=>setModal(null)} store={store}/>
          : <MatModal item={modal} onClose={()=>setModal(null)} store={store}/>
      )}

      {purchaseModal && <PurchaseModal onClose={()=>setPurchaseModal(false)} store={store}/>}
    </div>
  );
}
