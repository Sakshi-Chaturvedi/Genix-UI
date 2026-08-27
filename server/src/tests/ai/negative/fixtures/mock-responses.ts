export const mockButtonResponse = {
  success: true,
  data: {
    files: [
      {
        path: "Button.tsx",
        type: "code",
        language: "typescript",
        content: `
import React from 'react';
import styles from './Button.module.css';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  label?: string;
  isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ label, isLoading, disabled, onClick, ...props }) => {
  return (
    <button
      className={styles.btn}
      disabled={disabled || isLoading}
      onClick={onClick}
      aria-label={label || "Button"}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' && onClick) onClick(e as any);
      }}
      {...props}
    >
      {isLoading ? 'Loading...' : label}
    </button>
  );
};
`
      }
    ]
  }
};

export const mockCardResponse = {
  success: true,
  data: {
    files: [
      {
        path: "Card.tsx",
        type: "code",
        language: "typescript",
        content: `
import React from 'react';
import styles from './Card.module.css';

export interface CardProps {
  title: string;
  children: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({ title, children }) => {
  return (
    <article
      className={styles.card}
      role="region"
      aria-labelledby="card-title"
      tabIndex={0}
      onKeyDown={(e) => {}}
    >
      <header id="card-title">{title}</header>
      <main>{children}</main>
    </article>
  );
};
`
      }
    ]
  }
};

export const mockAccordionResponse = {
  success: true,
  data: {
    files: [
      {
        path: "Accordion.tsx",
        type: "code",
        language: "typescript",
        content: `
import React, { useState } from 'react';
import styles from './Accordion.module.css';

export interface AccordionProps {
  title: string;
  children: React.ReactNode;
}

export const Accordion: React.FC<AccordionProps> = ({ title, children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const contentId = "accordion-content";

  return (
    <div className={styles.accordion}>
      <button
        className={styles.header}
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-controls={contentId}
        role="button"
      >
        {title}
      </button>
      {isOpen && (
        <div id={contentId} className={styles.content}>
          {children}
        </div>
      )}
    </div>
  );
};
`
      }
    ]
  }
};

export const mockProfileCardResponse = {
  success: true,
  data: {
    files: [
      {
        path: "ProfileCard.tsx",
        type: "code",
        language: "typescript",
        content: `
import React from 'react';
import styles from './ProfileCard.module.css';

export interface ProfileCardProps {
  name: string;
  avatarUrl: string;
}

export const ProfileCard: React.FC<ProfileCardProps> = ({ name, avatarUrl }) => {
  return (
    <div className={styles.profile} aria-label="User Profile">
      <img src={avatarUrl} alt={\`Avatar of \${name}\`} className={styles.avatar} />
      <h2>{name}</h2>
    </div>
  );
};
`
      }
    ]
  }
};

export const mockNavbarResponse = {
  success: true,
  data: {
    files: [
      {
        path: "Navbar.tsx",
        type: "code",
        language: "typescript",
        content: `
import React, { useState } from 'react';
import styles from './Navbar.module.css';

export interface NavbarProps {
  brand: string;
  links: string[];
  isFixed: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({ brand, links, isFixed }) => {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav className={styles.navbar} role="navigation" aria-label="Main Navigation">
      <div className={styles.brand}>{brand}</div>
      <button
        className={styles.toggle}
        onClick={() => setMenuOpen(!menuOpen)}
        aria-expanded={menuOpen}
        tabIndex={0}
      >
        Menu
      </button>
      <ul className={menuOpen ? styles.linksOpen : styles.links}>
        {links.map((link, i) => (
          <li key={i}><a href={\`#\${link}\`}>{link}</a></li>
        ))}
      </ul>
    </nav>
  );
};
`
      },
      {
        path: "Navbar.module.css",
        type: "style",
        language: "css",
        content: `
.navbar { display: flex; align-items: center; }
.brand { font-weight: bold; }
.toggle { display: none; }
.links { display: flex; list-style: none; }
.linksOpen { display: flex; flex-direction: column; }
@media (max-width: 768px) {
  .toggle { display: block; }
  .links { display: none; }
}
`
      }
    ]
  }
};

export const mockModalResponse = {
  success: true,
  data: {
    files: [
      {
        path: "Modal.tsx",
        type: "code",
        language: "typescript",
        content: `
import React, { useEffect, useRef } from 'react';
import styles from './Modal.module.css';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && modalRef.current) {
      modalRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div
        className={styles.modal}
        ref={modalRef}
        role="dialog"
        aria-modal={true}
        aria-labelledby="modal-title"
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="modal-title">{title}</h2>
        <div>{children}</div>
        <button onClick={onClose}>Close</button>
      </div>
    </div>
  );
};
`
      }
    ]
  }
};

export const mockTabsResponse = {
  success: true,
  data: {
    files: [
      {
        path: "Tabs.tsx",
        type: "code",
        language: "typescript",
        content: `
import React, { useState } from 'react';
import styles from './Tabs.module.css';

export interface TabItem {
  id: string;
  label: string;
  content: React.ReactNode;
  isDisabled?: boolean;
}

export interface TabsProps {
  tabs: TabItem[];
}

export const Tabs: React.FC<TabsProps> = ({ tabs }) => {
  const [activeId, setActiveId] = useState(tabs[0]?.id);

  return (
    <div className={styles.tabs}>
      <div role="tablist" className={styles.tabList}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            role="tab"
            aria-selected={activeId === tab.id}
            aria-controls={\`panel-\${tab.id}\`}
            tabIndex={activeId === tab.id ? 0 : -1}
            className={activeId === tab.id ? styles.active : styles.tab}
            onClick={() => !tab.isDisabled && setActiveId(tab.id)}
            disabled={tab.isDisabled}
          >
            {tab.label}
          </button>
        ))}
      </div>
      {tabs.map((tab) => (
        <div
          key={tab.id}
          id={\`panel-\${tab.id}\`}
          role="tabpanel"
          hidden={activeId !== tab.id}
        >
          {tab.content}
        </div>
      ))}
    </div>
  );
};
`
      }
    ]
  }
};
