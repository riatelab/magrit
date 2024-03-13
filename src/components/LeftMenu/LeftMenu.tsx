// Imports from solid-js
import { JSX, createSignal, Show } from 'solid-js';

// Imports from other packages
import { AiOutlineLayout, AiOutlineBarChart } from 'solid-icons/ai';
import { FiLayers } from 'solid-icons/fi';
import { TbFileImport } from 'solid-icons/tb';
import { TiExportOutline } from 'solid-icons/ti';
import { RiDocumentPagesLine } from 'solid-icons/ri';

// Helpers
import { useI18nContext } from '../../i18n/i18n-solid';

// Subcomponents
import Collapse from '../Collapse.tsx';
import LayerManager from './LayerManager.tsx';
import ExportSection from './ExportSection.tsx';
import MapConfiguration from './MapConfiguration.tsx';
import ChevronIcon from '../Icons/ChevronIcon.tsx';
import PortrayalSection from './PortrayalSection.tsx';

// Styles
import '../../styles/LeftMenu.css';
import ImportSection from './ImportSection.tsx';
import LayoutFeatures from './LayoutFeatures.tsx';

const [expandedSection, setExpandedSection] = createSignal(1);

export function openLayerManager() {
  setExpandedSection(3);
}

export default function LeftMenu(): JSX.Element {
  const { LL } = useI18nContext();

  return <div class="left-menu" style={{ 'overflow-y': 'auto' }}>

    <div class="left-menu__title" onClick={() => setExpandedSection(1)}>
      <div class="left-menu__title-inner">
        <TbFileImport style={{ height: '1.1em' }} />
        <span>{ LL().LeftMenu.Import() }</span>
      </div>
      <button class={`chevron-button ${expandedSection() === 1 ? 'is-active' : ''}`}>
        <ChevronIcon />
      </button>
    </div>
    <Collapse value={expandedSection() === 1} >
      <div class="left-menu__section-container">
        <ImportSection />
      </div>
    </Collapse>

    <div class="left-menu__title" onClick={() => setExpandedSection(2)}>
      <div class="left-menu__title-inner">
        <AiOutlineLayout />
        <span>{ LL().LeftMenu.MapConfiguration() }</span>
      </div>
      <button class={`chevron-button ${expandedSection() === 2 ? 'is-active' : ''}`}>
        <ChevronIcon />
      </button>
    </div>
    <Collapse value={expandedSection() === 2} >
      <div class="left-menu__section-container">
        <MapConfiguration />
      </div>
    </Collapse>

    <div class="left-menu__title" onClick={() => setExpandedSection(3)}>
      <div class="left-menu__title-inner">
        <FiLayers />
        <span>{ LL().LeftMenu.LayerManager() }</span>
      </div>
      <button class={`chevron-button ${expandedSection() === 3 ? 'is-active' : ''}`}>
        <ChevronIcon />
      </button>
    </div>
    <Collapse value={expandedSection() === 3} >
      <div class="left-menu__section-container">
        <LayerManager />
      </div>
    </Collapse>

    <div class="left-menu__title" onClick={() => setExpandedSection(5)}>
      <div class="left-menu__title-inner">
        <RiDocumentPagesLine />
        <span>{ LL().LeftMenu.LayoutFeatures() }</span>
      </div>
      <button class={`chevron-button ${expandedSection() === 5 ? 'is-active' : ''}`}>
        <ChevronIcon />
      </button>
    </div>
    <Collapse value={expandedSection() === 5} >
      <div class="left-menu__section-container">
        <LayoutFeatures />
      </div>
    </Collapse>

    <div class="left-menu__title" onClick={() => setExpandedSection(6)}>
      <div class="left-menu__title-inner">
        <TiExportOutline />
        <span>{ LL().LeftMenu.ExportSection() }</span>
      </div>
      <button class={`chevron-button ${expandedSection() === 6 ? 'is-active' : ''}`}>
        <ChevronIcon />
      </button>
    </div>
    <Collapse value={expandedSection() === 6} >
      <div class="left-menu__section-container">
        <ExportSection />
      </div>
    </Collapse>

  </div>;
}
