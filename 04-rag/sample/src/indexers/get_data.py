import os
import PyPDF2
async def get_doc_data(embeddings):
    file_names = [
        "Earth", "Jupiter", "Mars", "Mercury", "Neptune",
        "Pluto", "Saturn", "Uranus", "Venus", "Star", "Interplanetary_spaceflight"
    ]
    docs = []
    for name in file_names:
        file_path = os.path.join(os.getcwd(), f"src/indexers/data/{name}.pdf")
        with open(file_path, 'rb') as file:  # Correct mode 'rb' for binary read
            reader = PyPDF2.PdfReader(file)
            raw_description = reader.pages[0].extract_text() or ""
        doc = {
            "docId": str(file_names.index(name) + 1),
            "docTitle": name,
            "description": raw_description,
            "descriptionVector": await get_embedding_vector(raw_description, embeddings=embeddings),
        }
        docs.append(doc)
    return docs


async def get_embedding_vector(text: str, embeddings):
    result = await embeddings.create_embeddings(text)
    if (result.status != 'success' or not result.output):
        if result.status == 'error':
            raise Exception(f"Failed to generate embeddings for description: <{text[:200]+'...'}>\n\nError: {result.output}")
        raise Exception(f"Failed to generate embeddings for description: <{text[:200]+'...'}>")
    
    return result.output[0]