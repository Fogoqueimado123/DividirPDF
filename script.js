let selectedFiles = [];

const dropArea = document.getElementById("dropArea");
["dragenter", "dragover", "dragleave", "drop"].forEach((eventName) => {
  dropArea.addEventListener(eventName, preventDefaults, false);
});

function preventDefaults(e) {
  e.preventDefault();
  e.stopPropagation();
}

["dragenter", "dragover"].forEach((eventName) => {
  dropArea.addEventListener(eventName, highlight, false);
});

["dragleave", "drop"].forEach((eventName) => {
  dropArea.addEventListener(eventName, unhighlight, false);
});

function highlight() {
  dropArea.classList.add("highlight");
}

function unhighlight() {
  dropArea.classList.remove("highlight");
}

dropArea.addEventListener("drop", handleDrop, false);

function handleDrop(e) {
  const dt = e.dataTransfer;
  const files = dt.files;
  handleFiles(files);
}

function handleFiles(files) {
  const newFiles = Array.from(files).filter(
    (file) => file.type === "application/pdf"
  );

  newFiles.forEach((file) => {
    if (!selectedFiles.some((f) => f.name === file.name)) {
      selectedFiles.push(file);
    }
  });

  renderFileList();
}

document
  .getElementById("pdfInput")
  .addEventListener("change", function (event) {
    handleFiles(event.target.files);
  });

function renderFileList() {
  const fileList = document.getElementById("fileList");
  fileList.innerHTML = "";

  if (selectedFiles.length === 0) {
    fileList.innerHTML =
      '<p style="text-align: center; color: #6c757d;">Nenhum arquivo selecionado</p>';
    return;
  }

  selectedFiles.forEach((file, index) => {
    const div = document.createElement("div");
    div.classList.add("file-item");

    div.innerHTML = `
          <div class="file-info">
            <i class="fas fa-file-pdf" style="color: #e63946; margin-right: 10px;"></i>
            <span class="file-name" title="${file.name}">${file.name}</span>
          </div>
          <div class="file-actions">
            <button onclick="moveUp(${index})" title="Mover para cima" ${
      index === 0 ? "disabled" : ""
    }>
              <i class="fas fa-arrow-up"></i>
            </button>
            <button onclick="moveDown(${index})" title="Mover para baixo" ${
      index === selectedFiles.length - 1 ? "disabled" : ""
    }>
              <i class="fas fa-arrow-down"></i>
            </button>
            <button onclick="removeFile(${index})" title="Remover arquivo">
              <i class="fas fa-times"></i> Remover
            </button>
          </div>
        `;

    fileList.appendChild(div);
  });
}

function removeFile(index) {
  selectedFiles.splice(index, 1);
  renderFileList();
}

function moveUp(index) {
  if (index > 0) {
    const temp = selectedFiles[index];
    selectedFiles[index] = selectedFiles[index - 1];
    selectedFiles[index - 1] = temp;
    renderFileList();
  }
}

function moveDown(index) {
  if (index < selectedFiles.length - 1) {
    const temp = selectedFiles[index];
    selectedFiles[index] = selectedFiles[index + 1];
    selectedFiles[index + 1] = temp;
    renderFileList();
  }
}

document.getElementById("mergeBtn").addEventListener("click", async () => {
  if (selectedFiles.length < 2) {
    alert("Selecione pelo menos 2 PDFs para juntar.");
    return;
  }

  const mergeBtn = document.getElementById("mergeBtn");
  const originalText = mergeBtn.innerHTML;
  mergeBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processando...';
  mergeBtn.disabled = true;

  try {
    const mergedPdf = await PDFLib.PDFDocument.create();

    for (const file of selectedFiles) {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await PDFLib.PDFDocument.load(arrayBuffer);
      const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
      copiedPages.forEach((page) => mergedPdf.addPage(page));
    }

    const mergedPdfBytes = await mergedPdf.save();
    const blob = new Blob([mergedPdfBytes], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "PDF-Mesclado.pdf";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    setTimeout(() => URL.revokeObjectURL(url), 100);

    document.getElementById("reloadBtn").classList.remove("hidden");
    document.getElementById("reloadBtn").classList.add("visible");
  } catch (error) {
    console.error("Erro ao processar o PDF:", error);
    alert(
      "Ocorreu um erro ao processar os PDFs. Verifique se os arquivos são válidos."
    );
  } finally {
    mergeBtn.innerHTML = originalText;
    mergeBtn.disabled = false;
  }
});

document.getElementById("reloadBtn").addEventListener("click", () => {
  location.reload();
});

renderFileList();
