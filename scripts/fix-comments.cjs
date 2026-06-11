const fs = require('fs');
const path = require('path');

function walk(dir) {
    const files = [];
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) files.push(...walk(full));
        else if (entry.name.endsWith('.tsx')) files.push(full);
    }
    return files;
}

for (const filePath of walk(path.join(__dirname, '..', 'src'))) {
    let content = fs.readFileSync(filePath, 'utf8');
    const orig = content;

    // Strategy: find all // comments that eat code on the same line
    // and insert newlines to "uncomment" the code that follows

    // Step 1: For // comments followed by a newline, they're fine.
    // Step 2: For // comments followed by code on the same line:
    //   Detect by checking if after // text, there's a colon (key: value) pattern or keyword
    
    // Use a character-by-character scan to handle this properly
    let result = '';
    let i = 0;
    
    while (i < content.length) {
        // Find next //
        const slashIdx = content.indexOf('//', i);
        if (slashIdx === -1) {
            result += content.substring(i);
            break;
        }
        
        // Check if // is inside a string
        const before = content.substring(0, slashIdx);
        const singleQ = (before.match(/'/g) || []).length;
        const doubleQ = (before.match(/"/g) || []).length;
        const backtick = (before.match(/`/g) || []).length;
        
        const inSingleString = singleQ % 2 !== 0;
        const inDoubleString = doubleQ % 2 !== 0;
        const inTemplate = backtick % 2 !== 0;
        
        if (inSingleString || inDoubleString || inTemplate) {
            // // is inside a string, skip it
            const nextIdx = content.indexOf('\n', slashIdx);
            const endIdx = nextIdx === -1 ? content.length : nextIdx + 1;
            result += content.substring(i, endIdx);
            i = endIdx;
            continue;
        }
        
        // This is a real comment. Find the end of the line.
        const newlineIdx = content.indexOf('\n', slashIdx);
        const lineEnd = newlineIdx === -1 ? content.length : newlineIdx;
        
        // Check if there's code after the // text that got eaten
        // The structure is: // CommentText OptionalCodeAfter
        const afterSlash = content.substring(slashIdx + 2, lineEnd);
        
        // If comment already has a newline after it, no fix needed
        if (newlineIdx === slashIdx + 2 || afterSlash.trim().length === 0) {
            // Empty comment or comment alone on line - fine
            const endIdx = newlineIdx === -1 ? content.length : lineEnd + 1;
            result += content.substring(i, endIdx);
            i = endIdx;
            continue;
        }
        
        // Check if the line has code after what looks like comment text
        // Heuristic: look for patterns like:
        // "// text 'key': 'value'" - found in translations  
        // "// text useEffect" - found in components
        // "// text const" - found in components
        
        // For translation-style: 'key': 'value' after comment
        const transMatch = afterSlash.match(/^(\s*[\wáéíóúÁÉÍÓÚ,\s()\-/]+?)(\s+'[^']+':\s*')/);
        if (transMatch) {
            const commentText = transMatch[1];
            const codePart = transMatch[2];
            result += content.substring(i, slashIdx);
            result += '//' + commentText.trim();
            result += '\n';
            result += codePart.trimStart();
            i = slashIdx + 2 + afterSlash.indexOf(codePart);
            continue;
        }
        
        // For code-style: keyword after comment
        const kwMatch = afterSlash.match(/^(\s*[\wáéíóúÁÉÍÓÚ\s,;.:()\-/]+?)\s+(useEffect|useState|useCallback|useMemo|useRef|useNavigate|useParams|useContext|import |export |const |let |var |function |if |for |while |switch |try |catch |return |class |interface |type |enum |async |throw |break |continue |new |yield )/);
        if (kwMatch) {
            const commentText = kwMatch[1];
            const keyword = kwMatch[2];
            result += content.substring(i, slashIdx);
            result += '//' + commentText.trim();
            result += '\n';
            result += keyword;
            i = slashIdx + 2 + afterSlash.indexOf(keyword) + keyword.length;
            continue;
        }
        
        // Also handle case where comment ends with a keyword embedded in text
        // e.g., "// Buscar sugerencias useEffect" 
        // Check individual keywords
        const keywords = ['useEffect', 'useState', 'useCallback', 'useMemo', 'useRef', 
            'import', 'export', 'const ', 'let ', 'var ', 'function ',
            'return ', 'if ', 'for ', 'while ', 'switch ', 'try ', 'catch ',
            'class ', 'interface ', 'type ', 'enum ', 'async ', 'throw ',
            'break ', 'continue ', 'new ', 'yield '];
        
        let found = false;
        for (const kw of keywords) {
            const kwIdx = afterSlash.indexOf(kw);
            if (kwIdx > 0) {
                // The keyword appears after some text - it's likely code
                const commentText = afterSlash.substring(0, kwIdx).trim();
                if (commentText.length > 0 && commentText.length < 200) {
                    result += content.substring(i, slashIdx);
                    result += '//' + commentText;
                    result += '\n';
                    result += afterSlash.substring(kwIdx);
                    i = lineEnd + 1;
                    found = true;
                    break;
                }
            }
        }
        if (found) continue;
        
        // If no match, copy as-is
        const endIdx = newlineIdx === -1 ? content.length : lineEnd + 1;
        result += content.substring(i, endIdx);
        i = endIdx;
    }
    
    content = result;
    
    if (content !== orig) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log('Fixed: ' + filePath);
    }
}
console.log('Done');
