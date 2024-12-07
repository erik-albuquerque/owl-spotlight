import pLimit from 'p-limit'

const promiseLimit = (
  function_: () => void | Promise<void>,
  concurrency: number | undefined = 10
) => {
  const limit = pLimit(concurrency)
  return limit(function_)
}

export { promiseLimit }
