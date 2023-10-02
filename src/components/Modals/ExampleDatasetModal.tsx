import { JSX } from 'solid-js';

interface DatasetEntry {
  name: string;
  description: string;
  type: string;
  keywords: string[];
  source: string;
  license: string;
  attribution: string;
  imageUrl: string;
}

function CardDatasetEntry(ds: DatasetEntry): JSX.Element {
  return <div class="card">
    <header class="card-header">
      <p class="card-header-title">
        { ds.name }
      </p>
    </header>
    <section class="card-content">
      <div class="content">
        { ds.description }
      </div>
    </section>
  </div>;
}

function CardDatasetDetail(): JSX.Element {

}

// A large modal (or even a full page) that shows the datasets
// available for the user to choose from.
//
// It should contain:
// - A search bar
// - A (paginated) list of datasets
// - A section with the details of the selected dataset
// - A button to confirm the selection and add it to the map
export default function ExampleDataModal(): JSX.Element {
  return <></>;
}
