import { JSX, createSignal } from 'solid-js';
import { Collapse } from 'solid-collapse';
import LayerManager from './LayerManager.tsx';
import './styles/LeftMenu.css';

export default function LeftMenu(): JSX.Element {
  const [expandedSection, setExpandedSection] = createSignal(1);

  return <div class="left-menu">
    <div class="left-menu__title" onClick={() => setExpandedSection(1)}>Import des données</div>
    <Collapse value={expandedSection() === 1} >
      <div> Le super menu d'import des couches </div>
    </Collapse>
    <div class="left-menu__title" onClick={() => setExpandedSection(2)}>Gestion des couches</div>
    <Collapse value={expandedSection() === 2}>
      <LayerManager />
    </Collapse>
    <div class="left-menu__title" onClick={() => setExpandedSection(3)}>Choix de la représentation</div>
    <Collapse value={expandedSection() === 3}>
      <div>Le super menu de choix d'une représentation ...</div>
    </Collapse>
  </div>;
}
