import { useParams } from 'wouter';
import BoardFormV2 from '../../components/boards/BoardFormV2';

export default function BoardEdit() {
  const params = useParams<{ id: string }>();
  const boardId = params.id ? parseInt(params.id) : undefined;

  if (!boardId) {
    return (
      <div className="container mx-auto p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h2 className="text-red-800 font-semibold mb-2">Erro</h2>
          <p className="text-red-600">ID da Mesa Diretora não encontrado.</p>
        </div>
      </div>
    );
  }

  return (
    <BoardFormV2 
      boardId={boardId}
      isEditing={true}
    />
  );
}