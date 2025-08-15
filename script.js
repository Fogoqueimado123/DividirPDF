let selectedFiles = [];

document.getElementById('pdfInput').addEventListener('change', function (event) {
    const file = event.target.files[0];
    if (!file) return;

    if (!selectedFiles.some(f => f.name === file.name)) {
        selectedFiles.push(file);
        renderFileList();
        document.getElementById('pageRangeContainer').style.display = "block";
        document.getElementById('splitBtn').style.display = "inline-block";
    }
});

function renderFileList() {
    const fileList = document.getElementById('fileList');
    fileList.innerHTML = "";

    selectedFiles.forEach((file, index) => {
        const div = document.createElement('div');
        div.classList.add('file-item');

        div.innerHTML = `
            ${file.name}
            <button onclick="removeFile(${index})">Remover</button>
        `;

        fileList.appendChild(div);
    });
}

function removeFile(index) {
    selectedFiles.splice(index, 1);
    renderFileList();
    if (selectedFiles.length === 0) {
        document.getElementById('pageRangeContainer').style.display = "none";
        document.getElementById('splitBtn').style.display = "none";
    }
}

document.getElementById('splitBtn').addEventListener('click', async () => {
    if (selectedFiles.length === 0) {
        alert("Selecione um arquivo PDF para dividir.");
        return;
    }

    const pageRangeInput = document.getElementById('pageRange').value.trim();
    if (!pageRangeInput) {
        alert("Digite um intervalo de páginas.");
        return;
    }

    const file = selectedFiles[0];
    const arrayBuffer = await file.arrayBuffer();
    const pdfDoc = await PDFLib.PDFDocument.load(arrayBuffer);

    const pageNumbers = parsePageRange(pageRangeInput, pdfDoc.getPageCount());

    const newPdf = await PDFLib.PDFDocument.create();
    const copiedPages = await newPdf.copyPages(pdfDoc, pageNumbers.map(n => n - 1));
    copiedPages.forEach(page => newPdf.addPage(page));

    const newPdfBytes = await newPdf.save();
    const blob = new Blob([newPdfBytes], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = 'PDF-Dividido.pdf';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

   
    document.getElementById('reloadBtn').style.display = 'inline-block';
});

document.getElementById('reloadBtn').addEventListener('click', () => {
    location.reload();
});

function parsePageRange(range, totalPages) {
    const pages = new Set();

    range.split(',').forEach(part => {
        if (part.includes('-')) {
            const [start, end] = part.split('-').map(Number);
            for (let i = start; i <= end && i <= totalPages; i++) {
                pages.add(i);
            }
        } else {
            const pageNum = Number(part);
            if (pageNum >= 1 && pageNum <= totalPages) {
                pages.add(pageNum);
            }
        }
    });

    return [...pages].sort((a, b) => a - b);
}
