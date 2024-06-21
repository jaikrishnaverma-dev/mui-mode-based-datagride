import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  DataGrid,
  GridColDef,
  GridSortModel,
  GridFilterModel,
  DataGridProps,
  GridToolbarContainer,
  GridToolbarExportContainer,
  GridCsvExportMenuItem,
  GridPrintExportMenuItem,
  GridToolbarColumnsButton,
  GridFilterItem,
  GridLogicOperator,
} from "@mui/x-data-grid";
import axios from "axios";
import { Box } from "@mui/system";
import { ListItemButton, TextField, Typography } from "@mui/material";
import { ListItemText } from "@mui/material";
import "./SimpleTable.css";
import { exportToExcel } from "./tools";
import { DataRow, WrapperDataGridProps } from "./DataGridTypes";

const SimpleTable: React.FC<WrapperDataGridProps> = ({
  mode = "server",
  apiEndpoint,
  columns,
  docTitle,
}) => {
  const debounceRef = React.useRef<NodeJS.Timeout | null>(null);
  const [data, setData] = useState<DataRow[]>([]);
  const [paginationModel, setPaginationModel] = React.useState({
    page: 0,
    pageSize: 10,
  });
  const [columnVisibilityModel, setColumnVisibilityModel] = useState<any>({});
  const [searchQuery, setSearchQuery] = useState("");
  const { page, pageSize } = paginationModel;
  const [rowCount, setRowCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [sortModel, setSortModel] = useState<GridSortModel>([]);

  const [filterModel, setFilterModel] = useState<GridFilterModel>({
    items: [],
    logicOperator: GridLogicOperator.Or,
  });

  console.log({ filterModel, op: GridLogicOperator.And });

  /**
   * api for get data do filter do search and pagination
   */
  const fetchData = useCallback(
    async (all: boolean = false) => {
      console.log("Occur", searchQuery);
      setLoading(true);
      try {
        let params: any = {
          query: searchQuery,
          sort: sortModel
            .map(({ field, sort }) => `${field}:${sort}`)
            .join(","),
          filters: filterModel.items
            .map(
              ({ field: columnField, operator: operatorValue, value }: any) =>
                `${columnField}:${operatorValue}:${value ?? ""}`
            )
            .join(","),
        };
        if (!all)
          params = { ...params, skip: page * pageSize, limit: pageSize };
        const response = await axios.get<any>(apiEndpoint, {
          params,
        });
        if (response.data) {
          setData([...response.data.products]);
          setRowCount(response.data.total);
        }
      } catch (error) {
        console.error("Error fetching data", error);
      } finally {
        setLoading(false);
      }
    },
    [searchQuery, filterModel, sortModel, paginationModel]
  );

  /**
   * single call for client side
   */
  useEffect(() => {
    if (mode === "client") {
      fetchData(true);
    }
  }, []);

  /**
   * multiple call on change of inputs wjhile server side
   */
  useEffect(() => {
    if (mode === "server") {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        fetchData();
      }, 300);
    }
  }, [page, pageSize, sortModel, filterModel, mode, searchQuery]);

  /**
   *
   * @param newFilterModel server side filter change
   */
  // const handleFilterChange = (newFilterModel: GridFilterModel) => {
  //   if (mode === "server") {
  //     setPaginationModel({
  //       ...paginationModel,
  //       page: 0,
  //     }); // Reset to first page whenever filters change
  //     setFilterModel(newFilterModel);
  //   }
  // };

  const handleSortChange = (newSortModel: GridSortModel) => {
    setSortModel(newSortModel);
    if (mode === "server") {
      setPaginationModel({
        ...paginationModel,
        page: 0,
      }); // Reset to first page whenever sorting changes
    }
  };

  /**
   * export excel from json data
   * in future we can placed apii call here to fetch data from api then convert into excel to bypass pagination
   */
  const exportExcel = () => {
    let arr: any = [];
    data.forEach((row: any) => {
      let obj: any = {};
      columns.forEach((col: any) => {
        obj[col.headerName] = row[col.field];
      });
      arr.push(obj);
    });
    exportToExcel(arr, docTitle);
  };

  /**
   * Export button in toolbar
   * @param param
   * @returns
   */
  const GridToolbarExport = ({ csvOptions, printOptions, ...other }: any) => (
    <GridToolbarExportContainer {...other}>
      <GridCsvExportMenuItem options={csvOptions} />
      <GridPrintExportMenuItem
        options={{
          hideToolbar: true,
        }}
      />
      <ListItemButton sx={{ py: "0px" }} onClick={exportExcel}>
        <ListItemText primary="Download as EXCEL" />
      </ListItemButton>
    </GridToolbarExportContainer>
  );

  const CustomToolbar: any = useCallback(
    (CustomToolbar: any, data: any) => {
      return (
        <div
          style={{ display: "flex", flexDirection: "column", width: "100%" }}
        >
          <div>
            {" "}
            <GridToolbarContainer>
              <GridToolbarColumnsButton />
              {/* <GridToolbarFilterButton
                />
                <GridToolbarDensitySelector
                  slotProps={{ tooltip: { title: "Change density" } }}
                /> */}

              <GridToolbarExport />
              <Box sx={{ flexGrow: 1 }} />
              {/* <GridToolbarQuickFilter
                  quickFilterParser={(searchInput) =>
                    searchInput.split(",").map((value) => value.trim())
                  }
                  quickFilterFormatter={(quickFilterValues) =>
                    quickFilterValues.join(", ")
                  }
                  debounceMs={200} // time before applying the new quick filter value
                /> */}
            </GridToolbarContainer>
          </div>
        </div>
      );
    },
    [data, filterModel]
  );
  /*** */
  const handleSearch = (event: any) => {
    const query = event.target.value;
    setSearchQuery(query);
  };
  const rowSelectionHandler = (selectedRows: any) => {
    console.log({ selectedRows });
  };
  /**
   * column search input handler logic
   */
  const columnFilterHandler = useCallback((e: any, params: any) => {
    e.stopPropagation();
    if (mode === "server") {
      setPaginationModel({
        ...paginationModel,
        page: 0,
      });
    }
    setFilterModel((prev: GridFilterModel) => {
      const index: number = prev.items.findIndex(
        (el: GridFilterItem) => el.field === params.colDef.field
      );
      if (index !== -1) {
        if (e.target.value == "") {
          prev.items.splice(index, 1);
        } else prev.items[index].value = e.target.value;
      } else {
        prev.items.push({
          field: params.field,
          operator: params.colDef.type === "number" ? "=" : "contains",
          value: e.target.value,
        });
      }
      return { ...prev };
    });
  }, []);

  const columnsWithFilters = useMemo(() => {
    const headers: GridColDef[] = columns;
    return headers.map((column: GridColDef) => {
      if (column?.headerName && !column.hasOwnProperty("width")) {
        column.width = column.headerName?.split("").length * 10;
      }
      return {
        ...column,
        renderHeader: (params: any) => {
          console.log({ params });
          return (
            <Box
              display="flex"
              flexDirection="column"
              style={{ minHeight: "100px", paddingTop: "45px" }}
            >
              <Typography variant="body2" fontWeight={600} gutterBottom>
                {params.colDef.headerName}
              </Typography>
              {column?.filterable !== false && (
                <div
                  className="datagrid_input-column"
                  onClick={(e: any) => e.stopPropagation()}
                >
                  <TextField
                    placeholder="Search"
                    style={{
                      padding: "2px !important",
                    }}
                    variant="outlined"
                    size="small"
                    onChange={(e) => columnFilterHandler(e, params)}
                  />
                </div>
              )}
            </Box>
          );
        },
      };
    });
  }, []);

  const tableProps: DataGridProps = useMemo(
    () => {
      const obj: DataGridProps = {
        pagination: true,
        density: "compact",
        columns: columnsWithFilters,
        disableColumnFilter: true,
        autoHeight: true,
        disableColumnMenu: true,
        columnHeaderHeight: 110,
        disableRowSelectionOnClick: true,
        checkboxSelection: true,
        onColumnVisibilityModelChange: setColumnVisibilityModel,
        onRowSelectionModelChange: rowSelectionHandler,
        slotProps: {
          toolbar: {
            showQuickFilter: true,
            printOptions: {
              hideFooter: true,
              hideToolbar: true,
            },
          },
        },
        slots: {
          toolbar: CustomToolbar,
        },
        initialState: {
          pagination: { paginationModel: { pageSize: 10 } },
        },
      };
      if (mode == "server") {
        if (obj?.slotProps?.toolbar)
          obj.slotProps.toolbar = {
            ...obj.slotProps?.toolbar,
            searchQuery: searchQuery,
            onSearchChange: handleSearch,
          };
        obj.keepNonExistentRowsSelected = true;
        obj.rowCount = rowCount;
        obj.paginationMode = "server";
        obj.sortingMode = "server";
        obj.filterMode = "server";
        obj.paginationModel = paginationModel;
        obj.onPaginationModelChange = setPaginationModel;
        obj.rowCount = rowCount;
        obj.onSortModelChange = handleSortChange;
      } else {
      }
      return {
        ...obj,
        loading,
        pageSizeOptions: [5, 10, 20, 50, 100, { value: -1, label: "All" }],
      };
    },
    mode === "server" ? [data, filterModel] : [data, filterModel]
  );

  return (
    <div style={{ width: "100%" }}>
      <DataGrid
        className="datagrid_custom"
        sx={{
          display: "flex",
          flexDirection: "column",
        }}
        {...tableProps}
        {...{ rows: data, loading: loading }}
        // onFilterModelChange={handleFilterChange}
        filterModel={filterModel}
      />

      <style>
        {`
    @media print{
        .MuiDataGrid-cell,
    .MuiDataGrid-columnHeader {
      width: calc(
        85% / ${
          columns.length -
          Object.values(columnVisibilityModel).filter((val: any) => !val).length
        }
      ) !important;
      min-width: 50px !important;
    }
    }
    `}
      </style>
    </div>
  );
};

export default SimpleTable;
