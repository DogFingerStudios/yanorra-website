import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Terminal } from '@xterm/xterm'
import { FitAddon } from '@xterm/addon-fit'
import '@xterm/xterm/css/xterm.css'
import '../styles/ReplPage.css'

type CommandHandler = (args: string[]) => void

const PROMPT = 'yanorra> '

const ReplPage = () =>
{
  const terminalHostRef = useRef<HTMLDivElement | null>(null)
  const terminalRef = useRef<Terminal | null>(null)
  const inputBufferRef = useRef('')
  const historyRef = useRef<string[]>([])
  const historyIndexRef = useRef(-1)
  const navigate = useNavigate()

  useEffect(() =>
  {
    if (!terminalHostRef.current)
    {
      return
    }

    const terminal = new Terminal(
      {
        convertEol: true,
        cursorBlink: true,
        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
        fontSize: 18,
        theme:
        {
          background: '#0b0f14',
          foreground: '#d7dde5'
        }
      }
    )
    const fitAddon = new FitAddon()
    terminal.loadAddon(fitAddon)
    terminalRef.current = terminal
    terminal.open(terminalHostRef.current)
    fitAddon.fit()

    const commandHandlers: Record<string, CommandHandler> =
    {
      help: () =>
      {
        terminal.writeln('Available commands:')
        terminal.writeln('  help                 Show this help output')
        terminal.writeln('  clear                Clear the REPL screen')
        terminal.writeln('  echo <text>          Print text')
        terminal.writeln('  date                 Show current browser date/time')
        terminal.writeln('  home                 Navigate to home page')
        terminal.writeln('  map                  Navigate to map page')
        terminal.writeln('  about                Navigate to about page')
        terminal.writeln('  wiki <slug>          Navigate to /wiki/<slug>')
      },
      clear: () =>
      {
        terminal.clear()
      },
      echo: (args: string[]) =>
      {
        terminal.writeln(args.join(' '))
      },
      date: () =>
      {
        terminal.writeln(new Date().toString())
      },
      home: () =>
      {
        navigate('/')
      },
      map: () =>
      {
        navigate('/map')
      },
      about: () =>
      {
        navigate('/about')
      },
      wiki: (args: string[]) =>
      {
        if (args.length === 0)
        {
          terminal.writeln('Usage: wiki <slug>')
          return
        }

        const slug = args.join('_')
        navigate(`/wiki/${encodeURIComponent(slug)}`)
      }
    }

    const commandNames = Object.keys(commandHandlers)

    const redrawPrompt = (nextInput: string) =>
    {
      terminal.write('\r\x1b[2K')
      terminal.write(PROMPT)
      terminal.write(nextInput)
      inputBufferRef.current = nextInput
    }

    const printWelcome = () =>
    {
      terminal.writeln('Yanorra Browser REPL')
      terminal.writeln('Type "help" to see available commands.')
      terminal.write(PROMPT)
    }

    const completeCommand = () =>
    {
      const rawInput = inputBufferRef.current
      const trimmedInput = rawInput.trim()

      if (trimmedInput.length === 0)
      {
        return
      }

      if (trimmedInput.includes(' '))
      {
        return
      }

      const matches = commandNames.filter((commandName) =>
      {
        return commandName.startsWith(trimmedInput)
      })

      if (matches.length === 1)
      {
        redrawPrompt(matches[0])
        return
      }

      if (matches.length > 1)
      {
        terminal.writeln('')
        terminal.writeln(matches.join('  '))
        redrawPrompt(trimmedInput)
      }
    }

    const runCommand = () =>
    {
      const rawInput = inputBufferRef.current
      const input = rawInput.trim()
      terminal.writeln('')

      if (input.length === 0)
      {
        terminal.write(PROMPT)
        return
      }

      historyRef.current.push(input)
      historyIndexRef.current = historyRef.current.length

      const segments = input.split(/\s+/)
      const command = segments[0].toLowerCase()
      const args = segments.slice(1)
      const commandHandler = commandHandlers[command]

      if (!commandHandler)
      {
        terminal.writeln(`Unknown command: ${command}`)
        terminal.writeln('Type "help" for a list of commands.')
        inputBufferRef.current = ''
        terminal.write(PROMPT)
        return
      }

      commandHandler(args)

      inputBufferRef.current = ''
      terminal.write(PROMPT)
    }

    const historyUp = () =>
    {
      if (historyRef.current.length === 0)
      {
        return
      }

      if (historyIndexRef.current > 0)
      {
        historyIndexRef.current -= 1
      }

      const nextInput = historyRef.current[historyIndexRef.current] ?? ''
      redrawPrompt(nextInput)
    }

    const historyDown = () =>
    {
      if (historyRef.current.length === 0)
      {
        return
      }

      const maxIndex = historyRef.current.length

      if (historyIndexRef.current < maxIndex)
      {
        historyIndexRef.current += 1
      }

      if (historyIndexRef.current === maxIndex)
      {
        redrawPrompt('')
        return
      }

      const nextInput = historyRef.current[historyIndexRef.current] ?? ''
      redrawPrompt(nextInput)
    }

    printWelcome()

    // Add resize observer to fit terminal when container size changes
    const resizeObserver = new ResizeObserver(() =>
    {
      fitAddon.fit()
    })
    resizeObserver.observe(terminalHostRef.current!)

    const dataSubscription = terminal.onData((data: string) =>
    {
      if (data === '\r')
      {
        runCommand()
        return
      }

      if (data === '\u007F')
      {
        const currentInput = inputBufferRef.current

        if (currentInput.length > 0)
        {
          inputBufferRef.current = currentInput.slice(0, -1)
          terminal.write('\b \b')
        }

        return
      }

      if (data === '\t')
      {
        completeCommand()
        return
      }

      if (data === '\u0003')
      {
        terminal.writeln('^C')
        inputBufferRef.current = ''
        terminal.write(PROMPT)
        return
      }

      if (data === '\u001b[A')
      {
        historyUp()
        return
      }

      if (data === '\u001b[B')
      {
        historyDown()
        return
      }

      if (data >= ' ')
      {
        inputBufferRef.current += data
        terminal.write(data)
      }
    })

    return () =>
    {
      resizeObserver.disconnect()
      dataSubscription.dispose()
      terminal.dispose()
      terminalRef.current = null
    }
  }, [navigate])

  return (
    <section className="repl-page">
      <div className="repl-panel">
        <div className="repl-panel-header">Yanorra REPL</div>
        <div className="repl-terminal-host" ref={terminalHostRef} />
      </div>
    </section>
  )
}

export default ReplPage