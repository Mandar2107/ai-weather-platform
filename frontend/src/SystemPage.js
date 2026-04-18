import React from "react";

const SystemPage = ({ eyebrow, title, description, cards }) => {
  return (
    <section className="dashboard-stack">
      <div className="panel">
        <p className="eyebrow">{eyebrow}</p>
        <h2>{title}</h2>
        <p className="muted">{description}</p>
      </div>

      <div className="feature-grid system-grid">
        {cards.map((card) => (
          <article key={card.title} className="feature-card">
            <strong>{card.title}</strong>
            <p>{card.text}</p>
          </article>
        ))}
      </div>
    </section>
  );
};

export default SystemPage;
