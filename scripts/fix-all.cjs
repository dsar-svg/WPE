const fs = require('fs');
const path = require('path');

const srcDir = path.resolve(__dirname, '..', 'src');

function fixLanguageContext(content) {
  // The translations object spans multiple lines with 'cart.continue' split
  // Fix 1: Join 'cart.\ncontinue' back together
  content = content.replace(/'cart\.\n\s*continue'/g, "'cart.continue'");
  
  // Fix 2: Fix cases where string values got split by newlines after commas
  // Rejoin lines inside the translations object
  // We need to find the translations object and fix internal newlines
  const lines = content.split('\n');
  const result = [];
  let inTranslations = false;
  let braceDepth = 0;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.includes('const translations')) {
      inTranslations = true;
      braceDepth = (line.match(/{/g) || []).length - (line.match(/}/g) || []).length;
      result.push(line);
      continue;
    }
    
    if (inTranslations) {
      braceDepth += (line.match(/{/g) || []).length;
      braceDepth -= (line.match(/}/g) || []).length;
      
      if (braceDepth <= 0 && line.trim().endsWith('};')) {
        inTranslations = false;
        result.push(line);
        continue;
      }
      
      // Inside translations: join to previous line if previous line doesn't end with a complete statement
      const prevLine = result[result.length - 1];
      const thisLineTrimmed = line.trim();
      const prevLineTrimmed = prevLine ? prevLine.trim() : '';
      
      // If this line starts with a continuation pattern (like 'continue'... or a value that got split)
      if (prevLine && (
          thisLineTrimmed.startsWith("continue'") || 
          // Check if line starts with text that's inside a string value (not starting with a new key)
          (thisLineTrimmed.startsWith("'") && thisLineTrimmed.includes("': '") && prevLineTrimmed.endsWith(",")) ||
          // Rejoin when the break is inside a string value
          (thisLineTrimmed.startsWith("'") || thisLineTrimmed.startsWith("for home delivery") || thisLineTrimmed.match(/^[a-z]/))
        )) {
        // Join with previous line
        if (prevLineTrimmed.endsWith(',')) {
          result[result.length - 1] = prevLine + ' ' + thisLineTrimmed;
        } else {
          result[result.length - 1] = prevLine + thisLineTrimmed;
        }
      } else {
        result.push(line);
      }
    } else {
      result.push(line);
    }
  }
  
  return result.join('\n');
}

function fixRestaurantContext(content) {
  // Fix try { ... } catch split across lines
  // Pattern: } } \n catch (err) -> } catch (err) { ... } else {
  content = content.replace(/\}\s*\}\s*\n\s*catch\s*\(/g, '} catch (');
  content = content.replace(/\}\s*\n\s*catch\s*\(/g, '} catch (');
  
  // Also fix the try-catch in update functions
  // Pattern: \n catch (error: any) -> join to previous line
  // But only when the previous line ends with }
  
  // More targeted: fix the specific try-catch for updateConfig, updateCategory, etc.
  content = content.replace(/(await fetchData\(\);)\s*\}\s*\n\s*catch/g, '$1 } catch');
  content = content.replace(/(error\) throw error;)\s*\}\s*\n\s*catch/g, '$1 } catch');
  content = content.replace(/(error\) throw error;)\s*\}\s*\}\s*\n\s*catch/g, '$1 } } catch');
  
  return content;
}

function fixAdminPage(content) {
  // Fix: });// Subcomponents\nfor formsfunction LocationForm( -> });\n// Subcomponents for forms\nfunction LocationForm(
  content = content.replace(
    /}\s*\/\/\s*Subcomponents\s*\n\s*for\s+formsfunction\s+LocationForm/g,
    '}\n\n// Subcomponents for forms\nfunction LocationForm'
  );
  
  return content;
}

function fixLandingPage(content) {
  // Line 24: } }, 100); }; const navLinks = [ ... ] might have issues
  // The issue is likely that some newline was inserted in the wrong place
  // Just ensure proper structure
  content = content.replace(
    /(window\.scrollTo\(\{.*?\}\).*?;\s*\}\s*\}\s*,\s*100\s*\)\s*;)\s*\}\s*;\s*const\s+navLinks/g,
    '$1 }; const navLinks'
  );
  
  return content;
}

function fixPublicMenuPage(content) {
  // Fix: // Initialize active category\nif not set\nuseMemo( -> // Initialize active category if not set\nuseMemo(
  content = content.replace(
    /\/\/ Initialize active category\s*\n\s*if\s+not\s+set\s*\n\s*useMemo/g,
    '// Initialize active category if not set\nuseMemo'
  );
  
  // Also fix: // Initialize active category if not set\nuseMemo -> make sure the comment doesn't eat useMemo
  // Already handled above
  
  return content;
}

// Process files
const filesToFix = {
  'LanguageContext.tsx': fixLanguageContext,
  'RestaurantContext.tsx': fixRestaurantContext,
  'AdminPage.tsx': fixAdminPage,
  'LandingPage.tsx': fixLandingPage,
  'PublicMenuPage.tsx': fixPublicMenuPage,
};

function processDirectory(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory() && entry.name !== 'node_modules') {
      processDirectory(fullPath);
    } else if (entry.isFile() && entry.name.endsWith('.tsx') && filesToFix[entry.name]) {
      console.log(`Fixing: ${path.relative(srcDir, fullPath)}`);
      let content = fs.readFileSync(fullPath, 'utf-8');
      const fixer = filesToFix[entry.name];
      content = fixer(content);
      fs.writeFileSync(fullPath, content, 'utf-8');
      console.log(`  Fixed ✓`);
    }
  }
}

processDirectory(srcDir);
console.log('\nDone fixing files.');
