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

const stmtKeywords = [
    'import', 'export default', 'export', 'const', 'let', 'var',
    'function', 'return', 'if', 'for', 'while', 'switch',
    'try', 'catch', 'finally', 'class', 'interface', 'type',
    'enum', 'async function', 'async', 'await', 'throw',
    'case', 'default:', 'break', 'continue', 'new',
    'yield', 'delete', 'typeof', 'void',
    'useEffect', 'useState', 'useCallback', 'useMemo', 'useRef',
    'useNavigate', 'useParams', 'useLocation', 'useContext',
];

stmtKeywords.sort((a, b) => b.length - a.length);

function escapeRegex(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

let count = 0;
for (const filePath of walk(path.join(__dirname, '..', 'src'))) {
    let content = fs.readFileSync(filePath, 'utf8');
    const orig = content;

    // Step 1: Fix // comments that eat code
    // Pattern: // comment text followed by a statement keyword
    // Insert a newline before the keyword (which was originally on the next line)
    for (const kw of stmtKeywords) {
        // Match: // some text NOT followed by newline, then the keyword
        // We want to avoid matching // comments that already end with newline
        // Look for // followed by text (no newline) then the keyword
        const escaped = escapeRegex(kw);
        // Only match when // doesn't have a \n before the keyword
        content = content.replace(
            new RegExp(`(//[^\n]*?)(${escaped}\\b)`, 'g'),
            (match, comment, keyword) => {
                // Don't split if the keyword is just a word in the comment
                // Check if the text between // and keyword looks like code
                const textAfterComment = comment.substring(2); // Remove //
                // If comment has code-like characters (parens, braces, etc.)
                // it might already be code, not a comment
                if (textAfterComment.trim().length === 0) return match;
                // Check if there are code indicators
                const hasCodeIndicators = /[=;{}\])\w]/.test(textAfterComment.slice(-1));
                if (hasCodeIndicators) return match;
                return comment + '\n' + keyword;
            }
        );
    }

    // Step 2: Insert newlines after statements
    // Insert newline after ; before statement keywords
    for (const kw of stmtKeywords) {
        const escaped = escapeRegex(kw);
        content = content.replace(new RegExp(`;(${escaped})`, 'g'), `;\n$1`);
    }
    
    // Insert newline after ; before JSX
    content = content.replace(/;(\s*<\/?[A-Za-z])/g, ';\n$1');
    
    // Insert newline after } before certain keywords
    const closingBlockKws = ['import', 'export default', 'export', 'const', 'let', 'var',
        'function', 'interface', 'type', 'class', 'enum', 'async'];
    for (const kw of closingBlockKws) {
        const escaped = escapeRegex(kw);
        content = content.replace(new RegExp(`}(\\s*)(${escaped})`, 'g'), '}\n$1$2');
    }

    // Step 3: Cleanup
    // Collapse multiple spaces
    content = content.replace(/[ \t]+/g, ' ');
    // Remove spaces before newlines
    content = content.replace(/ +\n/g, '\n');
    // Collapse multiple blank lines
    content = content.replace(/\n{3,}/g, '\n\n');
    // Remove leading/trailing whitespace
    content = content.replace(/^\n+/, '');
    if (!content.endsWith('\n')) content += '\n';

    if (content !== orig) {
        fs.writeFileSync(filePath, content, 'utf8');
        count++;
    }
}
console.log(`Fixed ${count} files`);
