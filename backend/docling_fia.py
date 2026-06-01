import threading
from pathlib import Path

PDF_PATH = Path(__file__).parent / "fia_regulations.pdf"

_chunks = None
_lock = threading.Lock()
_loaded = False

def load_regulations():
    global _chunks, _loaded

    if _loaded:
        return _chunks

    with _lock:
        if _loaded:
            return _chunks

        print("Loading FIA regulations with Docling (text mode)...")
        try:
            from docling.document_converter import DocumentConverter
            from docling.datamodel.pipeline_options import PdfPipelineOptions
            from docling.document_converter import PdfFormatOption
            from docling.datamodel.document import InputFormat

            pipeline_options = PdfPipelineOptions()
            pipeline_options.do_ocr = False
            pipeline_options.do_table_structure = False
            pipeline_options.generate_page_images = False
            pipeline_options.generate_picture_images = False

            converter = DocumentConverter(
                format_options={
                    InputFormat.PDF: PdfFormatOption(
                        pipeline_options=pipeline_options
                    )
                }
            )

            result = converter.convert(str(PDF_PATH))
            full_text = result.document.export_to_markdown()
            paragraphs = [p.strip() for p in full_text.split('\n\n') if len(p.strip()) > 80]
            _chunks = paragraphs
            _loaded = True
            print(f"Docling loaded {len(_chunks)} regulation chunks.")
            return _chunks

        except Exception as e:
            print(f"Docling failed: {e}, trying pypdf fallback...")
            try:
                import pypdf
                reader = pypdf.PdfReader(str(PDF_PATH))
                all_text = ""
                for page in reader.pages:
                    text = page.extract_text()
                    if text:
                        all_text += text + "\n\n"
                paragraphs = [p.strip() for p in all_text.split('\n\n') if len(p.strip()) > 80]
                _chunks = paragraphs
                _loaded = True
                print(f"pypdf loaded {len(_chunks)} regulation chunks.")
                return _chunks
            except Exception as e2:
                print(f"Both methods failed: {e2}")
                _chunks = []
                _loaded = True
                return _chunks


def get_relevant_regulations(topic: str, max_chunks: int = 3) -> str:
    chunks = load_regulations()
    if not chunks:
        return ""

    topic_lower = topic.lower()
    keyword_map = {
        "pit": ["pit stop", "pit lane", "tyre", "tire", "compound"],
        "overtake": ["overtaking", "defending", "position", "passing"],
        "safety": ["safety car", "virtual safety car", "yellow flag"],
        "tire": ["tyre", "tire", "compound", "soft", "medium", "hard"],
        "strategy": ["strategy", "undercut", "overcut", "stint"],
    }

    search_terms = []
    for key, terms in keyword_map.items():
        if key in topic_lower or any(t in topic_lower for t in terms):
            search_terms.extend(terms)

    if not search_terms:
        search_terms = ["pit stop", "tyre", "strategy"]

    scored = []
    for chunk in chunks:
        chunk_lower = chunk.lower()
        score = sum(chunk_lower.count(term) for term in search_terms)
        if score > 0:
            scored.append((score, chunk))

    scored.sort(key=lambda x: x[0], reverse=True)
    top_chunks = [c for _, c in scored[:max_chunks]]

    if not top_chunks:
        return ""

    result = " | ".join(top_chunks)
    return result[:800] if len(result) > 800 else result


def get_pit_stop_regulations(tire_age: int, compound: str) -> str:
    return get_relevant_regulations(f"pit stop tyre {compound} compound")


def get_overtake_regulations() -> str:
    return get_relevant_regulations("overtaking defending position")