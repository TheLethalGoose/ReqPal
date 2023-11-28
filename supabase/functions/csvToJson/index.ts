import {serve} from "https://deno.land/std@0.168.0/http/server.ts";

//Author: Fabian

interface ProductDetails {
  qualification: string;
  comment: string;
}

export type Product = {
    product_name: string;
    product_url: string;
}

interface Requirement {
  reqId: string;
  title: string;
  description: string;
  productDetails: { [key: string]: ProductDetails };
}

interface RequirementsJSON {
    catalog_name: string;
    products: Product[]
    requirements: Requirement[];
}

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

class ValidationError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "ValidationError";
    }
}

serve(async (req) => {

    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const contentType = req.headers.get('Content-Type');

        if (!contentType || !contentType.includes('multipart/form-data')) {
            return new Response(JSON.stringify({
                error: "Ungültiger Content-Type. Muss multipart/form-data sein."
            }), {
                headers: {
                    ...corsHeaders,
                    'Content-Type': 'application/json'
                },
                status: 415
            });
        }

        const formData = await req.formData();
        const csvFile: File = formData.get('csv') as File;

        if (!csvFile) {
            return new Response(JSON.stringify({
                error: "Keine CSV-Datei in den Formulardaten gefunden."
            }), {
                headers: {
                    ...corsHeaders,
                    'Content-Type': 'application/json'
                },
                status: 422
            });
        }

        const csvString = new TextDecoder('utf-8').decode(await csvFile.arrayBuffer());
        const csvLines = csvString.replace(/\r/g, "").split("\n");
        const firstRowWithProductsIndex = findFirstRowWithProducts(csvLines);

        validateCSVFormat(csvLines, firstRowWithProductsIndex);

        const fileNameWithoutExtension = csvFile.name.substring(0, csvFile.name.lastIndexOf('.'));
        const json = convertCSVtoJSONString(csvLines, firstRowWithProductsIndex, fileNameWithoutExtension);

        return new Response(JSON.stringify(json, null, 2), {
            headers: {
                ...corsHeaders,
                'Content-Type': 'application/json'
            },
            status: 200
        });


    } catch (error) {

        if (error instanceof ValidationError) {
            return new Response(JSON.stringify({error: error.message}), {
                headers: {
                    ...corsHeaders,
                    'Content-Type': 'application/json'
                },
                status: 400,
            });
        }

        return new Response(JSON.stringify({error: error.message}), {
            headers: {
                ...corsHeaders,
                'Content-Type': 'application/json'
            },
            status: 500,
        });
    }
});

function findFirstRowWithProducts(lines: string[]): number {
    for (let i = 0; i < Math.min(lines.length, 5); i++) {
        if (lines[i].startsWith(';;;')) {
            return i;
        }
    }
    throw new ValidationError('Keine gültige Startzeile unter den ersten 5 Zeilen gefunden.');
}


function validateCSVFormat(csvLines: string[], indexOfProductsRow: number){

    const productCol = csvLines[indexOfProductsRow];
    checkProductsColumn(productCol);

    const productList = productCol.split(';;;')[1].split(';').filter((product)=>product !== '');
    checkRequirementColumns(csvLines[indexOfProductsRow+1], productList.length / 2);
}
function checkProductsColumn(productRow: string) {
    if (productRow.length === 0) {
        console.error('Product row is empty');
        throw new ValidationError('Produktzeile ist leer');
    }
    if (!productRow.startsWith(';;;')) {
        console.error('Product row does not start with ";;;"');
        throw new ValidationError('Produktzeile muss mit 3 leeren Zellen beginnen');
    }

    const fields = productRow.split(';;;')[1].split(';');

    for (const field of fields){
        if (field === '') {
            console.error('Product row contains empty field');
            throw new ValidationError('Eine Produkt-Spalten-Name/-URL ist leer');
        }
    }
    if (fields.length % 2 !== 0) {
        console.error('Product row does not contain pairs of product names and URLs');
        throw new ValidationError('Produktzeile besteht nicht aus Paaren von Produktnamen und URLs');
    }

    for (let i = 0; i < fields.length; i += 2) {
        const productURL = fields[i + 1].trim();

        if (!productURL.startsWith('http://') && !productURL.startsWith('https://')) {
            console.error(`Product URL "${productURL}" is not valid.`);
            throw new ValidationError(`Produkt URL "${productURL}" ist keine valide URL.`);
        }

    }

    return true;
}
function checkRequirementColumns(line: string, products: number) {
    const requirementFields = line.split(';').slice(0, 3);
    const qualificationFields = line.split(';').slice(3);
    if (qualificationFields.length % 2 !== 0 || qualificationFields.length / 2 !== products) {
        console.error('Invalid number of product qualification fields');
        throw new ValidationError('Ungültige Anzahl von Produkt-Qualifizierung-Kommentar-Feldern');
    }
    for(let i = 0; i < qualificationFields.length; i += 2){
        if (qualificationFields[i] !== 'Qualifizierung' || qualificationFields[i + 1] !== 'Kommentar') {
            console.error('Invalid product colum titles');
            throw new ValidationError('Ungültige Produkt-Qualifizierung-Kommentar-Spaltentitel');
        }
    }
    const correctTitles = ['Req-ID', 'Titel', 'Beschreibung'];
    for (let i = 0; i < correctTitles.length; i++) {
        if (requirementFields[i] !== correctTitles[i]) {
            console.error('Invalid requirement column titles');
            throw new ValidationError('Ungültige Anforderung-Info-Spaltentitel');
        }
    }
    return true;
}
function convertCSVtoJSONString(csvLines: string[], indexOfProductsRow: number,  fileName: string): RequirementsJSON {

    const products = csvLines[indexOfProductsRow].split(";;;")[1].split(';');

    const mappedProducts: Product[] = [];

    for (let i = 0; i < products.length; i += 2) {
        mappedProducts.push({
            product_name: products[i],
            product_url: products[i + 1],
        });
    }


    const requirementsJson: RequirementsJSON = {
        catalog_name: fileName,
        products: mappedProducts,
        requirements: []
    };
    for(let i = indexOfProductsRow + 2; i < csvLines.length; i++){
        const currentLine = csvLines[i].split(";");

        if(currentLine.length === 0 || currentLine[0] === "" || currentLine[1] === ""){
            break;
        }

        const item: Requirement = {
            "reqId": currentLine[0],
            "title": currentLine[1],
            "description": currentLine[2],
            "productDetails": {}
        };

        for(let k = 0; k < mappedProducts.length; k++){
            const product = mappedProducts[k];
            const qualification = currentLine[k * 2 + 3];
            const comment = currentLine[k * 2 + 4];
            item.productDetails[product.product_name] = {
                "qualification": qualification,
                "comment": comment
            };
        }

        requirementsJson.requirements.push(item);
    }

    return requirementsJson;
}