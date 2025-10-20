import DOMPurify from 'dompurify';

function getSourceDimensions(svg: string) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(svg, 'image/svg+xml');
  const svgElement = doc.documentElement;

  const viewBox = svgElement.getAttribute('viewBox');
  if (viewBox) {
    const parts = viewBox.trim().split(/\s+|,/).map(Number);
    return {
      width: parts[2],
      height: parts[3],
      x: parts[0],
      y: parts[1],
    };
  }

  const width = svgElement.getAttribute('width');
  const height = svgElement.getAttribute('height');
  if (width && height) {
    return {
      width: parseFloat(width),
      height: parseFloat(height),
      x: 0,
      y: 0,
    };
  }

  try {
    // As a last resort, try to compute the bounding box
    // To do this, we need to temporarily add the SVG to the DOM
    const tempDiv = document.createElement('div');
    tempDiv.style.position = 'absolute';
    tempDiv.style.visibility = 'hidden';
    tempDiv.style.width = '0';
    tempDiv.style.height = '0';
    document.body.appendChild(tempDiv);
    tempDiv.innerHTML = svg;
    const svgElement2 = tempDiv.querySelector('svg')!;
    const bbox = svgElement2.getBBox();
    document.body.removeChild(tempDiv);
    return {
      width: bbox.width,
      height: bbox.height,
      x: bbox.x,
      y: bbox.y,
    };
  } catch (e) {
    console.warn('Cannot determine SVG dimensions, using defaults');
    return {
      width: 100,
      height: 100,
      x: 0,
      y: 0,
    };
  }
}

/**
 * Sanitize an SVG string (uploaded by the user)
 * to remove any potentially harmful content (such as scripts)
 * and to replace any class / id names that might
 * conflict with the rest of the application.
 *
 * @param svg
 */
const sanitizeSVG = (svg: string) => {
  // Use DOM purify to sanitize the SVG
  // This removes any potentially harmful content (such as scripts)
  const cleanSvg = DOMPurify.sanitize(svg);

  // Parse the SVG string
  const parser = new DOMParser();
  const doc = parser.parseFromString(cleanSvg, 'image/svg+xml');
  const svgDom = doc.documentElement;

  // Object to hold the mapping of old IDs and classes to new ones
  const idMap: Record<string, string> = {};
  const classMap: Record<string, string> = {};

  // Helper to generate a new unique ID or class name
  const generateNewName = (oldName: string) => `mgt-image-${oldName}-${Math.random().toString(36).substr(2, 9)}`;

  // Step 1: Handle width, height and viewBox attribute at the root level
  const dimensions = getSourceDimensions(cleanSvg);
  svgDom.setAttribute('width', (dimensions.width - dimensions.x).toString());
  svgDom.setAttribute('height', (dimensions.height - dimensions.y).toString());
  // svgDom.removeAttribute('viewBox'); // Remove existing viewBox to avoid conflicts
  svgDom.setAttribute(
    'viewBox',
    `${dimensions.x} ${dimensions.y} ${dimensions.width} ${dimensions.height}`,
  );

  // Step 2: Update all IDs
  const elementsWithId = svgDom.querySelectorAll('[id]');
  elementsWithId.forEach((elem) => {
    const oldId = elem.getAttribute('id')!;
    const newId = generateNewName(oldId);
    idMap[oldId] = newId; // Store the mapping
    elem.setAttribute('id', newId);
  });

  // Step 3: Update all class names
  svgDom.querySelectorAll('[class]').forEach((elem) => {
    const oldClasses = elem.getAttribute('class')!.split(/\s+/);
    const newClasses = oldClasses.map((oldClass) => {
      if (!classMap[oldClass]) {
        classMap[oldClass] = generateNewName(oldClass);
      }
      return classMap[oldClass];
    });
    elem.setAttribute('class', newClasses.join(' '));
  });

  // Step 4: Serialize the updated SVG DOM back to a string
  const serializer = new XMLSerializer();
  let serializedSvg = serializer.serializeToString(svgDom);

  // Step 5: Update all references to the IDs and classes
  Object.entries(idMap).forEach(([oldId, newId]) => {
    // eslint-disable-next-line no-param-reassign
    serializedSvg = serializedSvg.replace(new RegExp(`#${oldId}`, 'g'), `#${newId}`);
  });
  Object.entries(classMap).forEach(([oldClass, newClass]) => {
    // eslint-disable-next-line no-param-reassign
    serializedSvg = serializedSvg.replace(new RegExp(`\\.${oldClass}`, 'g'), `.${newClass}`);
  });
  return serializedSvg;
};

export const setSvgProperties = (
  props: {
    content: string,
    fillColor?: string,
    strokeColor?: string,
    strokeWidth?: number,
    fillOpacity?: number,
    strokeOpacity?: number,
  },
) => {
  const svg = props.content;
  const parser = new DOMParser();
  const doc = parser.parseFromString(svg, 'image/svg+xml');

  const svgDom = doc.documentElement;
  if (props.fillColor) svgDom.setAttribute('fill', props.fillColor);
  if (props.strokeColor) svgDom.setAttribute('stroke', props.strokeColor);
  if (props.strokeWidth) svgDom.setAttribute('stroke-width', props.strokeWidth.toString());
  if (props.fillOpacity) svgDom.setAttribute('fill-opacity', props.fillOpacity.toString());
  if (props.strokeOpacity) svgDom.setAttribute('stroke-opacity', props.strokeOpacity.toString());

  return (new XMLSerializer()).serializeToString(svgDom);
};

export default sanitizeSVG;
