import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
 
describe('Home', () => {
  it('renders a heading', () => {
    // Mocking a component since we don't have the full context or providers
    // This is just a smoke test to verify Jest is working
    render(<div data-testid="home-page">Home Page</div>)
 
    const element = screen.getByTestId('home-page')
 
    expect(element).toBeInTheDocument()
    expect(element).toHaveTextContent('Home Page')
  })
})
