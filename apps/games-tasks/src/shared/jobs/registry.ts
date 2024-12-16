import { Job } from './create-job'

export class JobRegistry {
  jobs: Map<string, Job> = new Map()

  register(job: Job) {
    this.jobs.set(job.name, job)
    return this
  }

  getAll() {
    return Array.from(this.jobs.values())
  }

  getJob(name: string) {
    return this.jobs.get(name)
  }
}
