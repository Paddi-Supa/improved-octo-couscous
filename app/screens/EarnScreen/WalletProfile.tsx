import { addDoc, collection, doc, getDoc, runTransaction, serverTimestamp } from 'firebase/firestore'
import React, { useEffect, useState } from 'react'
import { ActivityIndicator, Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native'
import { auth, db } from '../../../firebaseConfig'

const WalletProfile = () => {
  const [username, setUsername] = useState('')
  const [accountNumber, setAccountNumber] = useState('')
  const [bankName, setBankName] = useState('')
  const [amount, setAmount] = useState('')
  const [walletBalance, setWalletBalance] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    // prefill username from profile
    const load = async () => {
      const uid = auth.currentUser?.uid
      if (!uid) return
      try {
        const psnap = await getDoc(doc(db, 'profile', uid))
        if (psnap.exists()) setUsername(psnap.data()?.username || '')
      } catch (e) {
        console.warn('Failed to load profile for wallet form', e)
      }
      // load wallet balance
      try {
        const wsnap = await getDoc(doc(db, 'wallets', uid))
        if (wsnap.exists()) setWalletBalance(Number(wsnap.data()?.balance) || 0)
        else setWalletBalance(0)
      } catch (we) {
        console.warn('Failed to load wallet for withdrawal form', we)
        setWalletBalance(null)
      }
    }
    load()
  }, [])

  const submitWithdrawal = async () => {
    if (!accountNumber || !bankName) return Alert.alert('Missing fields', 'Please enter account number and bank name')
    const uid = auth.currentUser?.uid
    if (!uid) return Alert.alert('Not signed in', 'Please sign in')

    // validate amount
    const amt = Number(amount)
    if (!amt || isNaN(amt) || amt <= 0) return Alert.alert('Invalid amount', 'Please enter a valid withdrawal amount')

    setLoading(true)
    try {
      // Atomically check wallet balance and deduct the requested amount
      try {
        const newBalance = await runTransaction(db, async (tx: any) => {
          const walletRef = doc(db, 'wallets', uid)
          const snap = await tx.get(walletRef)
          if (!snap.exists()) throw new Error('NO_WALLET')
          const bal = Number(snap.data()?.balance) || 0
          if (amt > bal) throw new Error('INSUFFICIENT')
          const remaining = bal - amt
          tx.update(walletRef, { balance: remaining, userId: uid })
          return remaining
        })

        // create withdrawal request record
        await addDoc(collection(db, 'withdrawal'), {
          accountNumber,
          bankName,
          username,
          amount: amt,
          status: 'pending',
          userId: uid,
          createdAt: serverTimestamp()
        })

        // success: show popup and update local state
        setWalletBalance(newBalance)
        Alert.alert('Submitted', `Payment is being reviewed. ₦${amt} will be withdrawn. Remaining balance: ₦${newBalance}`)
        // optionally clear form
        setAccountNumber('')
        setBankName('')
        setAmount('')
      } catch (txErr: any) {
        if (txErr?.message === 'INSUFFICIENT') {
          // per your request, show warning popup
          Alert.alert('Caution', 'Please fill in a valid amount within your wallet balance.')
          setLoading(false)
          return
        }
        if (txErr?.message === 'NO_WALLET') {
          Alert.alert('No wallet', 'No wallet found for your account. Contact support.')
          setLoading(false)
          return
        }
        console.warn('Failed during withdrawal transaction', txErr)
        Alert.alert('Error', 'Failed to submit withdrawal')
        setLoading(false)
        return
      }
    } catch (e) {
      console.warn('Failed to submit withdrawal', e)
      Alert.alert('Error', 'Failed to submit withdrawal')
    } finally {
      setLoading(false)
    }
  }

  if (loading) return (
    <View style={styles.loadingWrap}><ActivityIndicator /></View>
  )

  return (
    <View style={styles.container}>
      <View style={styles.formWrap}>
        <Text style={styles.title}>Withdraw</Text>
        <Text style={styles.warningText}>
          Be advised: using a different account number or bank may lead to the termination of your account. Any fraudulent activity will result in account loss if detected.
        </Text>

        <View style={styles.instructionsWrap}>
          <Text style={styles.instructionItem}>• Please ensure you fill the field below in this format:</Text>
          <Text style={styles.instructionExample}>Username, accountnumber bankname, amount</Text>
        </View>
        <TextInput style={styles.input} placeholder="Username" value={username} onChangeText={setUsername} />
        <TextInput style={styles.input} placeholder="Account number" keyboardType="numeric" value={accountNumber} onChangeText={setAccountNumber} />
        <TextInput style={styles.input} placeholder="Bank name" value={bankName} onChangeText={setBankName} />
        <TextInput style={styles.input} placeholder="Amount to withdraw" keyboardType="numeric" value={amount} onChangeText={setAmount} />

        <View style={{ marginBottom: 12 }}>
          <Text style={{ color: '#333' }}>{walletBalance !== null ? `Available: ₦${walletBalance}` : 'Available: unknown'}</Text>
        </View>

        <TouchableOpacity style={styles.submitBtn} onPress={submitWithdrawal}>
          <Text style={styles.submitText}>Submit Withdrawal</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center' },
  formWrap: { width: '100%', maxWidth: 520, padding: 18, borderRadius: 12, backgroundColor: '#ffffff' },
  title: { fontSize: 20, fontWeight: '800', marginBottom: 12, textAlign: 'center' },
  input: { borderWidth: 1, borderColor: '#eee', padding: 12, borderRadius: 8, marginBottom: 12, width: '100%' },
  submitBtn: { backgroundColor: '#6d045b', padding: 12, borderRadius: 10, alignItems: 'center', width: '100%' },
  submitText: { color: '#fff', fontWeight: '700' },
  instructionsWrap: { marginBottom: 12, backgroundColor: '#FFF7ED', padding: 10, borderRadius: 8 },
  instructionItem: { color: '#92400E', fontSize: 13, marginBottom: 6 },
  instructionExample: { color: '#4B5563', fontSize: 13, fontWeight: '700' },
  warningText: { color: '#b21f2d', fontSize: 12, marginBottom: 12, lineHeight: 18, textAlign: 'left', backgroundColor: 'rgba(178,31,45,0.04)', padding: 8, borderRadius: 6 }
  ,loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' }
})

export default WalletProfile