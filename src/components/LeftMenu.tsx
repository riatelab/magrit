import { JSX, createSignal } from 'solid-js';
import Collapse from './Collapse.tsx';
import LayerManager from './LayerManager.tsx';
import ExportSection from './ExportSection.tsx';
import '../styles/LeftMenu.css';
import { useI18nContext } from '../i18n/i18n-solid';
import ChevronIcon from './ChevronIcon.tsx';

export default function LeftMenu(): JSX.Element {
  const { LL } = useI18nContext();

  const [expandedSection, setExpandedSection] = createSignal(1);
  return <div class="left-menu">

    <div class="left-menu__title" onClick={() => setExpandedSection(1)}>
      { LL().LeftMenu.Import() }
      <span class={`chevron-button ${expandedSection() === 1 ? 'is-active' : ''}`}>
        <ChevronIcon />
      </span>
    </div>
    <Collapse value={expandedSection() === 1} >
      <div> Le super menu d'import des couches </div>
    </Collapse>

    <div class="left-menu__title" onClick={() => setExpandedSection(2)}>
      { LL().LeftMenu.LayerManager() }
      <span class={`chevron-button ${expandedSection() === 2 ? 'is-active' : ''}`}>
        <ChevronIcon />
      </span>
    </div>
    <Collapse value={expandedSection() === 2} >
      <LayerManager />
    </Collapse>

    <div class="left-menu__title" onClick={() => setExpandedSection(3)}>
      { LL().LeftMenu.RepresentationChoice() }
      <span class={`chevron-button ${expandedSection() === 3 ? 'is-active' : ''}`}>
        <ChevronIcon />
      </span>
    </div>
    <Collapse value={expandedSection() === 3} >
      <div>Le super menu de choix d'une représentation ...</div>
    </Collapse>

    <div class="left-menu__title" onClick={() => setExpandedSection(4)}>
      { LL().LeftMenu.ExportSection() }
      <span class={`chevron-button ${expandedSection() === 4 ? 'is-active' : ''}`}>
        <ChevronIcon />
      </span>
    </div>
    <Collapse value={expandedSection() === 4} >
      { ExportSection() }
    </Collapse>

  </div>;
}
