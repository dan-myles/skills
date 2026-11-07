// @amp-agent-mode {"key":"cooper","label":"Cooper"}

import type { PluginAPI, ThreadID } from '@ampcode/plugin'

const LISTED = ['cooper']

const UNLISTED = [
	'cooper-architect',
	'cooper-blast-radius',
	'cooper-grill',
	'cooper-how',
	'cooper-no-comments',
	'cooper-sharpen',
	'cooper-verify',
	'cooper-why',
	'cooper-principle-attack-the-premise',
	'cooper-principle-boundary-discipline',
	'cooper-principle-build-the-lever',
	'cooper-principle-encode-lessons-in-structure',
	'cooper-principle-exhaust-the-design-space',
	'cooper-principle-experience-first',
	'cooper-principle-explain-the-number',
	'cooper-principle-fix-root-causes',
	'cooper-principle-foundational-thinking',
	'cooper-principle-guard-the-context-window',
	'cooper-principle-laziness-protocol',
	'cooper-principle-make-operations-idempotent',
	'cooper-principle-migrate-callers-then-delete-legacy-apis',
	'cooper-principle-minimize-reader-load',
	'cooper-principle-model-the-domain',
	'cooper-principle-never-block-on-the-human',
	'cooper-principle-outcome-oriented-execution',
	'cooper-principle-prove-it-works',
	'cooper-principle-redesign-from-first-principles',
	'cooper-principle-separate-before-serializing-shared-state',
	'cooper-principle-sequence-verifiable-units',
	'cooper-principle-subtract-before-you-add',
	'cooper-principle-test-behavior-not-implementation',
	'cooper-principle-type-system-discipline',
	'unslop',
]

const MODELS = {
	'claude-opus-5-5': 'anthropic/claude-opus-5-5',
	'claude-sonnet-5-5': 'anthropic/claude-sonnet-5-5',
	'gpt-6.1-sol': 'openai/gpt-6.1-sol',
} as const
const EFFORTS = ['low', 'medium', 'high', 'xhigh', 'max'] as const
type Model = keyof typeof MODELS
type Effort = (typeof EFFORTS)[number]

const PROTECTED_BRANCH = /^(main|master|trunk|develop|production|staging|release\/.+)$/

const MODE_INSTRUCTIONS = [
	'You are Cooper, an engineer the user hands tasks to.',
	'At the start of every new task, load the `cooper:cooper` skill with the skill tool and follow it, and its playbook, until the task is done.',
	'Start every subagent the skills declare with `cooper_subagent`, and ask the user every question and checkpoint with `cooper_checkpoint`.',
].join(' ')

const SUBAGENT_INSTRUCTIONS = [
	'You are a subagent started by Cooper. Do exactly what the brief asks, in the checkout you were given.',
	'Your work gets reviewed: report what you changed, what you ran and its output, and anything you could not do.',
	'When the brief says read-only, change no files.',
].join(' ')

type Option = { label: string; detail?: string }
type Question = { question: string; options: Option[]; allowOther?: boolean }

export default async function (amp: PluginAPI) {
	for (const name of LISTED) await amp.registerSkill({ path: `skills/${name}` })
	for (const name of UNLISTED) await amp.registerSkill({ path: `skills/${name}`, listed: false })

	const cooper = amp.createAgent({
		name: 'Cooper',
		extends: 'high',
		model: MODELS['claude-opus-5-5'],
		reasoningEffort: 'high',
		instructions: MODE_INSTRUCTIONS,
		tools: {
			add: ['plugin__*', 'create_thread', 'list_agent_modes', 'get_thread_status', 'send_thread_message', 'wait_for_threads', 'read_thread', 'find_thread'],
		},
		display: { label: 'Cooper', color: '#d97706' },
	})
	amp.registerAgentMode({
		key: 'cooper',
		label: 'Cooper',
		description:
			'Hand Cooper an engineering task (feature, bug, refactor, perf, investigation, prototype) and get back a verified, ready-for-review PR, babysat through CI and AI review. Use for real work on a repo.',
		agent: cooper.definition,
	})

	const subagents = new Map<string, ReturnType<PluginAPI['createAgent']>>()
	const subagent = (model: Model, effort: Effort) => {
		const key = `${model}:${effort}`
		let agent = subagents.get(key)
		if (!agent) {
			agent = amp.createAgent({
				name: `cooper-${model}-${effort}`,
				model: MODELS[model],
				reasoningEffort: effort,
				instructions: SUBAGENT_INSTRUCTIONS,
				tools: { include: ['*'], exclude: ['cooper_subagent', 'cooper_checkpoint', 'create_thread'] },
			})
			subagents.set(key, agent)
		}
		return agent
	}

	amp.registerTool({
		name: 'cooper_subagent',
		title: 'Cooper subagent',
		transcriptGroup: { active: 'Running Cooper subagents', complete: 'Ran Cooper subagents' },
		description:
			'Run one subagent on an exact model and reasoning effort, in this checkout, and return its final reply. ' +
			'Use it wherever a Cooper skill step says a subagent "uses `<model>` with `{effort: <e>}`" or `{reasoningEffort: <e>}`: pass that model and effort. ' +
			"Amp's built-in Task tool ignores the model, so never use Task for those steps. Call it several times in parallel to run subagents at once.",
		inputSchema: {
			type: 'object',
			properties: {
				model: { type: 'string', enum: Object.keys(MODELS), description: 'The model the Cooper step declares.' },
				effort: { type: 'string', enum: [...EFFORTS], description: 'The effort the Cooper step declares.' },
				brief: { type: 'string', description: 'The complete brief. The subagent sees nothing else from this thread.' },
				timeoutMinutes: { type: 'number', description: 'How long to wait for it. Defaults to 30.' },
			},
			required: ['model', 'effort', 'brief'],
		},
		async execute(input, ctx) {
			const model = input.model as Model
			const effort = input.effort as Effort
			const brief = typeof input.brief === 'string' ? input.brief.trim() : ''
			if (!(model in MODELS)) return `Unknown model ${String(input.model)}. Use one of: ${Object.keys(MODELS).join(', ')}.`
			if (!EFFORTS.includes(effort)) return `Unknown effort ${String(input.effort)}. Use one of: ${EFFORTS.join(', ')}.`
			if (!brief) return 'Missing brief.'
			const minutes = typeof input.timeoutMinutes === 'number' && input.timeoutMinutes > 0 ? input.timeoutMinutes : 30
			const result = await subagent(model, effort).run(brief, {
				parentThreadID: ctx.thread.id,
				timeoutMs: minutes * 60 * 1000,
			})
			return `Subagent https://ampcode.com/threads/${result.threadID} (${model}, ${effort}):\n\n${result.text}`
		},
	})

	amp.registerTool({
		name: 'cooper_checkpoint',
		title: 'Cooper checkpoint',
		description:
			"Ask the user Cooper's checkpoint or question in a dialog only a person can answer, and return their answers. " +
			'Put the catch-up (where the work is, the problem, why it is their call, what each option does) in `catchUp` as Markdown. ' +
			'Each question lists your recommended option first, labeled "(Recommended)", and each option a one-line detail on what happens and what it costs. ' +
			'Up to four questions; the user can also type their own answer.',
		inputSchema: {
			type: 'object',
			properties: {
				title: { type: 'string', description: 'A short title for the decision.' },
				catchUp: { type: 'string', description: 'The catch-up as Markdown, so the dialog stands on its own.' },
				questions: {
					type: 'array',
					minItems: 1,
					maxItems: 4,
					items: {
						type: 'object',
						properties: {
							question: { type: 'string' },
							options: {
								type: 'array',
								minItems: 2,
								items: {
									type: 'object',
									properties: { label: { type: 'string' }, detail: { type: 'string' } },
									required: ['label'],
								},
							},
							allowOther: { type: 'boolean', description: 'Let the user type their own answer. Defaults to true.' },
						},
						required: ['question', 'options'],
					},
				},
			},
			required: ['title', 'catchUp', 'questions'],
		},
		async execute(input, ctx) {
			const title = String(input.title ?? 'Cooper checkpoint')
			const catchUp = String(input.catchUp ?? '')
			const questions = (Array.isArray(input.questions) ? input.questions : []) as Question[]
			if (!questions.length) return 'No questions given.'

			await ctx.thread.addLabels(['cooper-checkpoint'])
			const answers: string[] = []
			try {
				for (const [i, q] of questions.entries()) {
					if (ctx.signal.aborted) return 'Stopped.'
					const labels = q.options.map((o) => o.label)
					const lines = q.options.map((o) => (o.detail ? `- **${o.label}**: ${o.detail}` : `- **${o.label}**`))
					const header = questions.length > 1 ? ` (${i + 1} of ${questions.length})` : ''
					const answer = await ctx.ui.select({
						title: title + header,
						message: [i === 0 ? catchUp : '', `**${q.question}**`, lines.join('\n')].filter(Boolean).join('\n\n'),
						options: labels,
						initialValue: labels[0],
						allowOther: q.allowOther ?? true,
						requireHuman: true,
					})
					if (answer === undefined) {
						answers.push(`${i + 1}. ${q.question}\n   → dismissed without an answer`)
						return `${answers.join('\n')}\n\nThe user dismissed the dialog. Don't act on the open questions: ask in plain text what they'd like, and end the turn.`
					}
					const typed = labels.includes(answer) ? '' : ' (typed by the user)'
					answers.push(`${i + 1}. ${q.question}\n   → ${answer}${typed}`)
				}
			} catch (error) {
				if (error instanceof Error && amp.helpers.isPluginUINotAvailableError(error)) {
					return 'No one can answer a dialog here (headless run, or no one is watching). Ask in plain text with your pick named, then end the turn.'
				}
				throw error
			} finally {
				const left = (await ctx.thread.labels()).filter((l) => l !== 'cooper-checkpoint')
				await ctx.thread.setLabels(left)
			}
			return `The user answered:\n${answers.join('\n')}`
		},
	})

	const isCooper = new Map<ThreadID, Promise<boolean>>()
	const cooperThread = (thread: { id: ThreadID; agent(): Promise<{ definition: unknown }> }) => {
		let known = isCooper.get(thread.id)
		if (!known) {
			known = thread
				.agent()
				.then(({ definition }) => {
					const def = definition as { kind?: string; name?: string }
					return def.kind === 'agent-definition' && (def.name ?? '').toLowerCase().startsWith('cooper')
				})
				.catch(() => false)
			isCooper.set(thread.id, known)
		}
		return known
	}

	amp.on('session.start', async (_event, ctx) => {
		if (await cooperThread(ctx.thread)) await ctx.thread.addLabels(['cooper'])
	})

	amp.on('tool.call', async (event, ctx) => {
		const shell = amp.helpers.shellCommandFromToolCall(event)
		if (!shell || !(await cooperThread(ctx.thread))) return { action: 'allow' }

		for (const cmd of splitCommands(shell.command)) {
			const words = tokenize(cmd)
			const rule = await checkRule(words, shell.dir)
			if (!rule) continue
			if (rule.kind === 'block') return { action: 'reject-and-continue', message: rule.message }
			try {
				const ok = await ctx.ui.confirm({
					title: rule.title,
					message: `${rule.message}\n\n\`\`\`sh\n${cmd}\n\`\`\``,
					confirmButtonText: 'Allow',
					requireHuman: true,
				})
				if (!ok) return { action: 'reject-and-continue', message: 'The user declined this. Do not retry it; say what you need instead.' }
			} catch {
				return { action: 'reject-and-continue', message: `${rule.message} No one could approve it here, so ask the user in plain text.` }
			}
		}
		return { action: 'allow' }
	})

	type Rule = { kind: 'block'; message: string } | { kind: 'ask'; title: string; message: string }

	async function checkRule(words: string[], dir?: string): Promise<Rule | null> {
		const [bin, sub, verb] = words
		if (bin === 'gh' && sub === 'pr' && verb === 'create' && words.some((w) => w === '--draft' || w === '-d')) {
			return { kind: 'block', message: 'Cooper opens PRs ready for review, never as drafts. Run it again without --draft.' }
		}
		if (bin === 'gh' && sub === 'pr' && verb === 'ready' && words.includes('--undo')) {
			return { kind: 'block', message: 'Cooper never turns a PR back into a draft.' }
		}
		if (bin === 'gh' && sub === 'stack' && verb === 'submit' && words.includes('--auto') && !words.includes('--open')) {
			return { kind: 'block', message: '`gh stack submit --auto` without `--open` opens drafts. Add --open.' }
		}
		if (bin === 'gh' && sub === 'pr' && verb === 'merge') {
			return { kind: 'ask', title: 'Cooper wants to merge a PR', message: 'Cooper stops at merge-ready and merges only when you say so.' }
		}
		if (bin === 'git' && sub === 'push') {
			const force = words.some((w) => w === '--force' || w === '-f' || w.startsWith('--force-with-lease') || /^\+/.test(w))
			const targets = await pushTargets(words, dir)
			const shared = targets.filter((t) => PROTECTED_BRANCH.test(t))
			if (shared.length) {
				return {
					kind: 'ask',
					title: force ? 'Cooper wants to force-push a shared branch' : 'Cooper wants to push to a shared branch',
					message: `This pushes to ${shared.join(', ')}. Cooper works on its own branch and opens a PR instead.`,
				}
			}
		}
		return null
	}

	async function pushTargets(words: string[], dir?: string): Promise<string[]> {
		const args = words.slice(2).filter((w) => !w.startsWith('-'))
		const refspecs = args.slice(1)
		if (refspecs.length) return refspecs.map((r) => r.replace(/^\+/, '').split(':').pop()!.replace(/^refs\/heads\//, ''))
		const cwd = dir ?? (amp.system.workspaceRoot ? amp.helpers.filePathFromURI(amp.system.workspaceRoot) : '.')
		const head = await amp.$`git -C ${cwd} rev-parse --abbrev-ref HEAD`
		return head.exitCode === 0 ? [head.stdout.trim()] : []
	}
}

function splitCommands(command: string): string[] {
	return command
		.split(/&&|\|\||;|\n|\|/)
		.map((c) => c.trim())
		.filter(Boolean)
}

function tokenize(command: string): string[] {
	const words = command.match(/"[^"]*"|'[^']*'|\S+/g) ?? []
	const unquoted = words.map((w) => w.replace(/^["']|["']$/g, ''))
	while (unquoted.length && /^[A-Z_][A-Z0-9_]*=/.test(unquoted[0])) unquoted.shift()
	return unquoted
}
