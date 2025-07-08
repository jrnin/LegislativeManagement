import { useParams } from 'wouter';
import BoardForm from './BoardForm';

export default function EditBoardPage() {
  const { id } = useParams<{ id: string }>();
  
  return <BoardForm boardId={Number(id)} isEditing />;
}