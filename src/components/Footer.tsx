
export default function Footer() {
  return (
    <>
      <div className="my-5">&nbsp;</div>
      <div className="container-fluid bg-secondary-subtle bg-opacity-75 mt-5">
        <footer className="row py-5 mt-5">
          <div className="col-6 col-md-2 mb-3">
            <a href="/" className="d-flex align-items-center mb-3 link-body-emphasis text-decoration-none">
              <img src="https://www.flexar.space/FlexarIconBG.png" alt="Flexar" height="42" /> <span className="text-muted">© {(new Date()).getFullYear()}<br /></span>
            </a>
            <p>
              <a href="https://twitter.com/FlexarSpace" className="link-primary me-3" target="_blank"><i className="bi bi-twitter fs-3"></i></a>
              <a href="https://discord.gg/uBVgnSWydc" className="link-discord me-3" target="_blank"><i className="bi bi-discord fs-3"></i></a>
            </p>
          </div>

          <div className="col-6 col-md-6 mb-3 text-center align-items-center">
            <p className="text-body-secondary d-flex align-items-center mb-0"><i className="bi bi-envelope-at fs-3 me-3"></i>contact<i className="bi bi-at"></i>flexar<sub><i className="bi bi-dot mx-n1"></i></sub>space</p>
          </div>

          <div className="col-6 col-md-2 mb-3">
            <a href="https://github.com/kind3r/flexar-nft-converter" className="text-body-secondary d-flex align-items-center mb-0">
              View source on <i className="bi bi-github fs-3 ms-2"></i>
            </a>
          </div>

          <div className="col-6 col-md-2 mb-3">
            <h5>Flexar Products</h5>
            <ul className="nav flex-column">
              <li className="nav-item mb-2"><a href="https://sub.flexar.app" className="nav-link p-0 text-body-secondary">Subscriptions</a></li>
              <li className="nav-item mb-2"><a href="https://snap.flexar.app" className="nav-link p-0 text-body-secondary">Snapshot</a></li>
              <li className="nav-item mb-2"><a href="https://drop.flexar.app" className="nav-link p-0 text-body-secondary">Airdrop</a></li>
              <li className="nav-item mb-2"><a href="https://trades.flexar.app" className="nav-link p-0 text-body-secondary">Trades</a></li>
            </ul>
          </div>
        </footer>
      </div>
    </>
  )
}