import DOMPurify from 'dompurify';

/**
 * Sanitize an SVG string (uploaded by the user)
 * to remove any potentially harmful content (such as scripts)
 * and to replace any class / id names that might
 * conflict with the rest of the application.
 *
 * @param svg
 */
const sanitizeSVG = (svg: string) => {
  console.time('sanitizeSVG');
  // Use DOM purify to sanitize the SVG
  // This removes any potentially harmful content (such as scripts)
  const cleanSvg = DOMPurify.sanitize(svg);

  // Parse the SVG string
  const parser = new DOMParser();
  const doc = parser.parseFromString(cleanSvg, 'image/svg+xml');
  const svgDom = doc.documentElement;

  // Object to hold the mapping of old IDs and classes to new ones
  const idMap: Record<string, any> = {};
  const classMap: Record<string, any> = {};

  // Helper to generate a new unique ID or class name
  const generateNewName = (oldName: string) => `mgt-image-${oldName}-${Math.random().toString(36).substr(2, 9)}`;

  // Step 1: Handle width, height and viewBox attribute at the root level
  const width = svgDom.getAttribute('width');
  const height = svgDom.getAttribute('height');
  const viewBox = svgDom.getAttribute('viewBox');
  if (width && height) {
    if (!viewBox) {
      svgDom.setAttribute('viewBox', `0 0 ${width} ${height}`);
    }
    svgDom.removeAttribute('width');
    svgDom.removeAttribute('height');
  }

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

  console.timeEnd('sanitizeSVG');
  return serializedSvg;
};

export default sanitizeSVG;
