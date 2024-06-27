export function clsx(...classes: (string | false | null | undefined | 0)[]) {
  return classes.filter(Boolean).join(' ')
}
