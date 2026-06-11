const fs = require('fs');
const path = require('path');

function fixLanguageContext(content) {
  // Step 1: Find the translations object boundaries
  const transStart = content.indexOf('const translations');
  if (transStart === -1) return content;
  
  // Find the matching `};` that closes the translations object
  // by tracking brace depth
  let braceDepth = 0;
  let foundOpen = false;
  let transEnd = transStart;
  
  for (let i = transStart; i < content.length; i++) {
    const ch = content[i];
    if (ch === '{') { braceDepth++; foundOpen = true; }
    else if (ch === '}') { braceDepth--; }
    
    if (foundOpen && braceDepth === 0) {
      // Check if followed by ;
      if (content[i + 1] === ';') transEnd = i + 2;
      else transEnd = i + 1;
      break;
    }
  }
  
  if (transEnd <= transStart) return content;
  
  const before = content.slice(0, transStart);
  const transObj = content.slice(transStart, transEnd);
  const after = content.slice(transEnd);
  
  // Step 2: Collapse the translations object to single line
  // Remove any existing newlines within the translations
  const singleLine = transObj
    .replace(/\r?\n\s*/g, ' ')  // Replace newlines with space
    .replace(/\s{2,}/g, ' ')    // Collapse multiple spaces
    .trim();
  
  // Step 3: Extract the key-value pairs and reformat
  // The pattern is: const translations: Type = { es: { 'key': 'value', ... }, en: { ... }, zh: { ... } };
  
  // Find where the actual object starts (after '= {')
  const objStart = singleLine.indexOf('= { ');
  if (objStart === -1) return content;
  
  const prefix = singleLine.slice(0, objStart + 3); // 'const translations: Type = {'
  const objContent = singleLine.slice(objStart + 3, singleLine.lastIndexOf(' }')); // content inside outer { }
  
  // Now parse the inner content by language sections
  // Each language section: langKey: { 'key': 'value', ... }
  // We need to split by language top-level keys (es:, en:, zh:)
  
  const langs = ['es:', 'en:', 'zh:'];
  const sections = [];
  let remaining = objContent;
  
  for (let i = 0; i < langs.length; i++) {
    const langKey = langs[i];
    const idx = remaining.indexOf(langKey);
    if (idx === -1) continue;
    
    // Find the matching closing brace for this section
    const sectionStart = idx + langKey.length;
    let depth = 0;
    let sectionEnd = sectionStart;
    for (let j = sectionStart; j < remaining.length; j++) {
      const ch = remaining[j];
      if (ch === '{') depth++;
      else if (ch === '}') {
        depth--;
        if (depth === 0) {
          sectionEnd = j + 1;
          break;
        }
      }
    }
    
    const section = remaining.slice(sectionStart, sectionEnd);
    sections.push({ lang: langKey.replace(':', ''), content: section });
    remaining = remaining.slice(sectionEnd);
  }
  
  // Step 4: Reformat each section with each key-value pair on its own line
  const reformattedSections = sections.map(({ lang, content }) => {
    // Extract content inside braces
    const inner = content.slice(1, -1).trim();
    
    // Split into key-value pairs by splitting at ', ' but only at top level
    // Since values don't contain ', ', simple split works
    const pairs = [];
    let current = '';
    let inString = false;
    let stringChar = '';
    
    for (let i = 0; i < inner.length; i++) {
      const ch = inner[i];
      if (inString) {
        current += ch;
        if (ch === stringChar && (i === 0 || inner[i-1] !== '\\')) {
          inString = false;
        }
      } else if ((ch === "'" || ch === '"') && !inString) {
        current += ch;
        inString = true;
        stringChar = ch;
      } else if (ch === ',' && !inString) {
        pairs.push(current.trim());
        current = '';
        // Skip any whitespace
        while (i + 1 < inner.length && inner[i + 1] === ' ') i++;
      } else {
        current += ch;
      }
    }
    if (current.trim()) pairs.push(current.trim());
    
    const formattedPairs = pairs.map(p => `    ${p}`).join(',\n');
    return `  ${lang}: {\n${formattedPairs},\n  }`;
  });
  
  const reformatted = `${prefix}\n${reformattedSections.join(',\n')}\n};`;
  
  return before + reformatted + after;
}

function fixRestaurantContext(content) {
  // Fix try-catch patterns where newline was inserted between } and catch
  // Pattern 1: } \n catch -> join
  content = content.replace(/}\s*\n\s*catch\s*\(/g, '} catch (');
  
  // Also fix: try { ... } \n catch -> try { ... } catch
  // And: } \n finally -> } finally
  
  return content;
}

function fixPWAInstallPrompt(content) {
  // Fix: line 8 and 11 have issues with JSX or function declarations
  // The useEffect/useCallback calls might be broken
  
  // Fix missing parentheses or function declarations
  // Look for patterns where newlines broke function calls
  content = content.replace(/}\s*,\s*\[\s*\]\s*\)\s*;?\s*\n\s*const\s+/g, '}, []);\nconst ');
  content = content.replace(/}\s*,\s*\[\s*\]\s*\)\s*;?\s*\n\s*export\s+/g, '}, []);\nexport ');
  
  return content;
}

function fixPublicMenuPage(content) {
  // Fix: lines 18-19
  // Original had: useMemo(() => { ... }, [categories, activeCategory]);
  // But comment split broke the structure
  
  // Fix: useMemo(\nfor safety\n -> useMemo( // for safety
  content = content.replace(/useMemo\s*\(\s*\(\)\s*=>\s*\{[^}]*\}\s*,\s*\[[^\]]*\]\s*\)\s*;?\s*\n\s*for\s+safety/g, 
    (match) => match.replace(/\n\s*for\s+safety/, ' // for safety'));
  
  // More generally: fix "for safety" appearing after useMemo call
  content = content.replace(/,\s*\[categories,\s*activeCategory\]\s*\)\s*;?\s*;?\s*\n\s*for\s+safety/g, 
    ', [categories, activeCategory]); // for safety');
  
  return content;
}

function fixLandingPage(content) {
  // Fix line 24: variable declaration
  // The issue is that a comment or statement got split
  content = content.replace(
    /window\.scrollTo\s*\(\s*\{\s*top:\s*offsetPosition,\s*behavior:\s*'smooth'\s*\}\s*\)\s*;\s*\}\s*\}\s*,\s*100\s*\)\s*;\s*\}\s*;\s*const\s+navLinks/g,
    "window.scrollTo({ top: offsetPosition, behavior: 'smooth' }); } }, 100); }; const navLinks"
  );
  
  return content;
}

// Process files
const srcDir = path.resolve(__dirname, '..', 'src');

function processDirectory(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory() && entry.name !== 'node_modules') {
      processDirectory(fullPath);
    } else if (entry.isFile() && entry.name.endsWith('.tsx')) {
      console.log(`Processing: ${path.relative(srcDir, fullPath)}`);
      let content = fs.readFileSync(fullPath, 'utf-8');
      const originalContent = content;
      
      if (entry.name === 'LanguageContext.tsx') {
        content = fixLanguageContext(content);
      } else if (entry.name === 'RestaurantContext.tsx') {
        content = fixRestaurantContext(content);
      } else if (entry.name === 'PWAInstallPrompt.tsx') {
        content = fixPWAInstallPrompt(content);
      } else if (entry.name === 'PublicMenuPage.tsx') {
        content = fixPublicMenuPage(content);
      } else if (entry.name === 'LandingPage.tsx') {
        content = fixLandingPage(content);
      }
      
      if (content !== originalContent) {
        fs.writeFileSync(fullPath, content, 'utf-8');
        console.log(`  ✓ Fixed`);
      } else {
        console.log(`  - No changes needed`);
      }
    }
  }
}

processDirectory(srcDir);
console.log('\nDone.');
