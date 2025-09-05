export default function Page(props: PageProps<"/foo/[id]">) {
  return <div>Hello {props.params.id}</div>;
}
