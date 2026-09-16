export type CardProps = {
    title: string
}

export function Card(props: CardProps) {
    return <div>{props.title}</div>
}
