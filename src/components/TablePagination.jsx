import { ChevronLeft, ChevronRight } from "lucide-react";

const TablePagination = ({ totalItems, itemsPerPage, currentPage, onPageChange }) => {
    const totalPages = Math.ceil(totalItems / itemsPerPage);

    if (totalPages <= 1) return null;

    return (
        <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '10px', marginTop: '15px', padding: '10px' }}>
            <span style={{ fontSize: '0.9rem', color: 'gray' }}>
                Página <b>{currentPage}</b> de <b>{totalPages}</b>
            </span>
            
            <div style={{ display: 'flex', gap: '5px' }}>
                <button 
                    onClick={() => onPageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    style={{
                        padding: '6px', border: '1px solid #ddd', background: 'white', borderRadius: '4px', cursor: currentPage === 1 ? 'not-allowed' : 'pointer', opacity: currentPage === 1 ? 0.5 : 1
                    }}
                >
                    <ChevronLeft size={18} />
                </button>
                <button 
                    onClick={() => onPageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    style={{
                        padding: '6px', border: '1px solid #ddd', background: 'white', borderRadius: '4px', cursor: currentPage === totalPages ? 'not-allowed' : 'pointer', opacity: currentPage === totalPages ? 0.5 : 1
                    }}
                >
                    <ChevronRight size={18} />
                </button>
            </div>
        </div>
    );
};

export default TablePagination;