
import React from 'react';

const companies = [
  { id: 2, name: 'Sportruo', description: 'Global sports ecosystem', href: '/company/sportruo' },
  { id: 3, name: 'Adom', description: 'Advertising & campaigns' },
  { id: 4, name: 'Healthruo', description: 'Health services, providers & care' },
  { id: 5, name: 'Xedruo Education', description: 'Education, courses & learning' },
  { id: 6, name: 'Xedruo Energy', description: 'Energy, solar & inverter solutions' },
  { id: 7, name: 'Xedruo Logistics', description: 'Logistics, delivery & tracking' },
  { id: 8, name: 'Xedruo Properties', description: 'Real estate, property listings & services' },
  { id: 9, name: 'Spacetruo', description: 'Space, offices, venues & bookings' },
  { id: 10, name: 'HIREUO', description: 'Jobs, careers & recruitment', href: 'https://hireuo.xedruo.com/' },
  { id: 12, name: 'Xedruo AI Elinit', description: 'AI products & intelligence' },
];

export default function XedruoGroupHoldings() {
  return (
    <main>
      <section>
        <h1>Xedruo Group Holdings</h1>
        <p>One group. Independent platforms.</p>

        <div className="company-grid">
          {companies.map((company) => (
            <article key={company.name} className="company-card">
              <span>{String(company.id).padStart(2, '0')}</span>
              <h2>{company.name}</h2>
              <p>{company.description}</p>

              <a href={company.href || `/company/${company.name.toLowerCase().replaceAll(' ', '-')}`}>
                Open independent platform ↗
              </a>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
