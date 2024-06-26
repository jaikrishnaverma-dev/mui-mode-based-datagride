import { GridColDef, GridRowClassNameParams, GridRowParams } from "@mui/x-data-grid";

export interface WrapperDataGridProps {
    mode?: "server" | "client";
    apiEndpoint: string;
    columns: GridColDef[];
    docTitle: string;
    onRowClick?:(rowData:{columns:any[],id:string|number,row:any})=>void;
    onCellClick?:(rowData:any)=>void;
    isRowSelectable?:(params: GridRowParams) => boolean;
    getRowClassName?:(params: GridRowClassNameParams) => string
    defaultSelection?:(params: GridRowParams) => boolean
  }

export  interface DataRow {
    id: number;
    title: string;
    price: number;
    availabilityStatus: string;
    brand: string;
    category: string;
    description: string;
    dimensions: {
      width: number;
      height: number;
      depth: number;
    };
    discountPercentage: number;
    images: string[];
    meta: {
      createdAt: string;
      updatedAt: string;
    };
    minimumOrderQuantity: number;
    rating: number;
    returnPolicy: string;
    reviews: {
      rating: number;
      comment: string;
      date: string;
    }[];
    shippingInformation: string;
    sku: string;
    stock: number;
    tags: string[];
    thumbnail: string;
    warrantyInformation: string;
  }

  