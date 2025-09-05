export default function Page(props: { params: { id: string } }) {
  return <div>Hello {props.params.id}</div>;
}
