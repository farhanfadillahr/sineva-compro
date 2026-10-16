import { describe, expect, it } from 'vitest'
import { blogLabelsFromMessages } from '@/components/pages/blog/blog-labels'
import en from '../../messages/en.json'

describe('blogLabelsFromMessages', () => {
  const labels = blogLabelsFromMessages(en)

  it('reads the Blog namespace of the English messages', () => {
    expect(labels.allCategories).toBe(en.Blog.allCategories)
    expect(labels.homeCrumb).toBe(en.Pages.home)
    expect(labels.blogCrumb).toBe(en.Pages.blog)
    expect(labels.article.tocTitle).toBe(en.Blog.article.tocTitle)
  })

  it('fills the placeholders of the templated labels', () => {
    expect(labels.pageLink(3)).toBe(en.Blog.pageLink.replace('{page}', '3'))
    expect(labels.pageLink(3)).not.toContain('{')
    expect(labels.article.byAuthor('Rina')).toBe(en.Blog.article.byAuthor.replace('{name}', 'Rina'))
    expect(labels.article.byAuthor('Rina')).toContain('Rina')
  })

  it('throws with the missing key instead of rendering a raw key', () => {
    const broken = { ...en, Blog: { ...en.Blog, emptyTitle: '' } }
    expect(() => blogLabelsFromMessages(broken)).toThrow('Blog.emptyTitle')
    const noArticle = { ...en, Blog: { ...en.Blog, article: undefined } }
    expect(() => blogLabelsFromMessages(noArticle)).toThrow('Blog.article.')
  })

  it('has the copy the design system asks for', () => {
    // Copywriting section 4: the blog CTA is "Read article"; the empty state offers a consultation.
    expect(en.Blog.readArticle).toBe('Read article')
    expect(en.Blog.emptyCta).toBe('Book a free consultation')
    expect(en.Blog.article.copyLink).toBe('Copy link')
    expect(en.Blog.article.linkCopied).toBe('Link copied')
  })
})
