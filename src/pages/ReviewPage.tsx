import PageHeader from '../components/PageHeader';
import ReviewSession from '../components/ReviewSession';
import { useUnits } from '../lib/units';

export default function ReviewPage() {
  const units = useUnits();
  return (
    <>
      <PageHeader title="Ôn tập" subtitle="Nhìn tình huống, nói to tiếng Anh rồi lật thẻ" />
      {units && <ReviewSession units={units} emptyText="Hôm nay bạn đã ôn hết. Học thêm bài mới hoặc quay lại vào ngày mai nhé!" />}
    </>
  );
}
