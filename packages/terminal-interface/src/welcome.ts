import { terminal } from 'terminal-kit'

export function showWelcomeMessage() {
  terminal.windowTitle('Aktyn Assistant')
  terminal(productNameAsciiArt)
}

//TODO: variants for smaller console width
const productNameAsciiArt = `
 █████  ██   ██ ████████ ██    ██ ███    ██                            
██   ██ ██  ██     ██     ██  ██  ████   ██                            
███████ █████      ██      ████   ██ ██  ██                            
██   ██ ██  ██     ██       ██    ██  ██ ██                            
██   ██ ██   ██    ██       ██    ██   ████                            
                                                                       
                                                                       
 █████  ███████ ███████ ██ ███████ ████████  █████  ███    ██ ████████ 
██   ██ ██      ██      ██ ██         ██    ██   ██ ████   ██    ██    
███████ ███████ ███████ ██ ███████    ██    ███████ ██ ██  ██    ██    
██   ██      ██      ██ ██      ██    ██    ██   ██ ██  ██ ██    ██    
██   ██ ███████ ███████ ██ ███████    ██    ██   ██ ██   ████    ██    


`
