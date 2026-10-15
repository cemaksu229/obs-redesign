import { Link } from 'react-router-dom'
import { OTHER_GROUPS } from '../data/other.js'

export default function Other() {
  return (
    <>
      <div className="page-head">
        <div>
          <h1>Belgeler ve başvurular</h1>
          <p>Eski sistemde 48 başlıksız menü öğesi vardı. Sık kullanılanlar ana menüde, geri kalanı burada anlamlı gruplar hâlinde. Herhangi birini Ctrl+K ile de arayabilirsin.</p>
        </div>
      </div>
      <div className="other-grid">
        {OTHER_GROUPS.map((g) => (
          <section key={g.id} className="panel" aria-labelledby={`g-${g.id}`}>
            <h2 id={`g-${g.id}`}>{g.title}</h2>
            <p className="small muted" style={{ marginBottom: 10 }}>{g.desc}</p>
            <ul className="other-list">
              {g.items.map((i) => (
                <li key={i.id} id={i.id}>
                  {i.to ? <Link to={i.to}>{i.title}</Link> : <span>{i.title} <span className="badge">Demoda yok</span></span>}
                  {i.desc && <span className="small muted">{i.desc}</span>}
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </>
  )
}
