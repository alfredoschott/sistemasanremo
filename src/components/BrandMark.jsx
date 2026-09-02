import logo from '../assets/logo.png'

export default function BrandMark({ className = '', compact = false }) {
  return (
    <img
      src={logo}
      alt="SRM Telsa Transformadores"
      className={`${className} object-contain ${compact ? '' : 'drop-shadow-sm'}`}
    />
  )
}
