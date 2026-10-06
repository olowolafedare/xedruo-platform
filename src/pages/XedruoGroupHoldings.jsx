import React from 'react';

const companies = [
  { id: 2, name: 'Sportruo', description: 'Global sports ecosystem' },
  { id: 3, name: 'Hireuo', description: 'Jobs, recruitment & workforce' },
  { id: 4, name: 'Adom', description: 'Advertising & campaigns' },
  { id: 5, name: 'Healthruo', description: 'Health services, providers & care' },
  { id: 6, name: 'Xedruo Education', description: 'Education, courses & learning' },
  { id: 7, name: 'Xedruo Energy', description: 'Energy, solar & inverter solutions' },
  { id: 8, name: 'Xedruo Logistics', description: 'Logistics, delivery & tracking' },
  { id: 9, name: 'Xedruo Properties', description: 'Real estate, property listings & services' },
  { id: 10, name: 'Spacetruo', description: 'Space, offices, venues & bookings' },
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
              <a href={`/company/${company.name.toLowerCase().replaceAll(' ', '-')}`}>
                Open independent platform ↗
              </a>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
