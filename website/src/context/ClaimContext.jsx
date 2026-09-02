import { createContext, useContext, useMemo, useState } from 'react'

const ClaimContext = createContext(null)

export function ClaimProvider({ children }) {
  const [claim, setClaim] = useState(null)
  const [verdict, setVerdict] = useState(null)
  const [language, setLanguage] = useState('hi')

  const setClaimResult = (claimText, verdictData, claimLanguage) => {
    setClaim(claimText)
    setVerdict(verdictData)
    if (claimLanguage) setLanguage(claimLanguage)
  }

  const clearClaimResult = () => {
    setClaim(null)
    setVerdict(null)
  }

  const value = useMemo(
    () => ({ claim, verdict, language, setClaimResult, clearClaimResult }),
    [claim, verdict, language]
  )

  return <ClaimContext.Provider value={value}>{children}</ClaimContext.Provider>
}

export function useClaim() {
  const context = useContext(ClaimContext)
  if (!context) {
    throw new Error('useClaim must be used within a ClaimProvider')
  }
  return context
}
